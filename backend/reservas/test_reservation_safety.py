from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack
from datetime import time, timedelta
from threading import Barrier
from unittest import skipUnless
from unittest.mock import patch

from django.core import mail
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.management import call_command
from django.db import IntegrityError, close_old_connections, connection, transaction
from django.test import TestCase, TransactionTestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Business, Patient, Reservation, ResourceSlot, ResourceTemplate, User, WaitlistEntry
from .serializers import ReservationCreateSerializer, ReservationPublicSerializer
from .utils import offer_slot_to_waitlist
from .reservation_transactions import reservation_transaction


class ReservationFixtures:
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(username="safe_doctor")
        self.business = Business.objects.create(user=self.user)
        self.patient = Patient.objects.create(
            business=self.business, first_name="Ana", last_name="Pérez",
            email="ana@example.com",
        )
        self.template = ResourceTemplate.objects.create(
            business=self.business, name="Turnos", weekday=0,
            start_time=time(9), end_time=time(12), duration=timedelta(hours=1),
        )
        self.slot = self.make_slot(2)
        self.client = APIClient()

    def make_slot(self, days):
        start = timezone.now() + timedelta(days=days)
        return ResourceSlot.objects.create(
            template=self.template, date=timezone.localdate(start), start_datetime=start,
        )

    def make_reservation(self, slot=None, status="confirmed"):
        return Reservation.objects.create(
            slot=slot or self.slot, patient=self.patient, status=status,
            reservation_firstname="Ana", reservation_lastname="Pérez",
        )

    def make_entry(self, slot=None, status="offered", email="ana@example.com"):
        return WaitlistEntry.objects.create(
            business=self.business, first_name="Ana", last_name="Pérez", email=email,
            status=status, offered_slot=slot,
            offer_expires_at=timezone.now() + timedelta(hours=1) if slot else None,
        )

    def public_payload(self, number=0):
        return {
            "slot_id": str(self.slot.pk), "first_name": "Paciente", "last_name": str(number),
            "email": f"patient{number}@example.com", "phone": "098123456",
        }

    def claim(self, entry):
        return self.client.post(reverse("public-waitlist-claim", args=[entry.pk]))


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ReservationSafetyTests(ReservationFixtures, TestCase):
    def test_database_slot_conflict_is_translated_after_rollback(self):
        from rest_framework.exceptions import ValidationError
        self.make_reservation()
        duplicate = Reservation(
            slot=self.slot, patient=self.patient,
            reservation_firstname="Ana", reservation_lastname="Pérez",
        )
        with self.assertRaises(ValidationError) as caught:
            with reservation_transaction():
                Reservation.objects.bulk_create([duplicate])
        self.assertIn("slot_id", caught.exception.detail)
        self.assertEqual(Reservation.objects.count(), 1)

    def test_unrelated_integrity_error_is_not_reported_as_occupied_slot(self):
        invalid = Reservation(
            slot=self.slot, patient=self.patient,
            reservation_firstname=None, reservation_lastname="Pérez",
        )
        with self.assertRaises(IntegrityError):
            with reservation_transaction():
                Reservation.objects.bulk_create([invalid])
        self.assertEqual(Reservation.objects.count(), 0)

    def test_database_rejects_duplicate_confirmed_even_without_model_validation(self):
        self.make_reservation()
        duplicate = Reservation(
            slot=self.slot, patient=self.patient,
            reservation_firstname="Ana", reservation_lastname="Pérez",
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            Reservation.objects.bulk_create([duplicate])
        self.assertEqual(Reservation.objects.count(), 1)

    def test_cancelled_history_does_not_prevent_new_confirmed_reservation(self):
        self.make_reservation(status="cancelled")
        self.make_reservation(status="cancelled")
        self.make_reservation()
        self.assertEqual(Reservation.objects.filter(status="confirmed").count(), 1)
        self.assertEqual(Reservation.objects.count(), 3)

    def test_manual_reservation_saves_patient_snapshot(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("reservation-list"), {
            "slot_id": str(self.slot.pk), "patient_id": str(self.patient.pk),
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Reservation.objects.get().reservation_firstname, "Ana")

    def test_both_serializers_recheck_slot_after_validation(self):
        from types import SimpleNamespace
        from rest_framework.exceptions import ValidationError
        serializers = [
            ReservationPublicSerializer(data=self.public_payload()),
            ReservationCreateSerializer(
                data={"slot_id": str(self.slot.pk), "patient_id": str(self.patient.pk)},
                context={"request": SimpleNamespace(user=self.user)},
            ),
        ]
        for serializer in serializers:
            serializer.is_valid(raise_exception=True)
        self.make_reservation()
        for serializer in serializers:
            with self.subTest(serializer=type(serializer).__name__):
                with self.assertRaises(ValidationError):
                    serializer.save()
        self.assertEqual(Reservation.objects.count(), 1)

    def test_expired_get_is_read_only_and_null_expiry_is_rejected(self):
        entry = self.make_entry(self.slot)
        for expiry in (timezone.now() - timedelta(seconds=1), None):
            with self.subTest(expiry=expiry):
                WaitlistEntry.objects.filter(pk=entry.pk).update(offer_expires_at=expiry)
                response = self.client.get(reverse("public-waitlist-claim", args=[entry.pk]))
                self.assertEqual(response.status_code, 400)
                entry.refresh_from_db()
                self.assertEqual(entry.status, "offered")

    def test_expired_post_does_not_cancel_existing_reservation(self):
        old = self.make_reservation(self.make_slot(4))
        entry = self.make_entry(self.slot)
        WaitlistEntry.objects.filter(pk=entry.pk).update(offer_expires_at=None)
        self.assertEqual(self.claim(entry).status_code, 400)
        old.refresh_from_db()
        self.assertEqual(old.status, "confirmed")
        entry.refresh_from_db()
        self.assertEqual(entry.status, "expired")

    def test_occupied_claim_preserves_previous_booking(self):
        old = self.make_reservation(self.make_slot(4))
        self.make_reservation()
        entry = self.make_entry(self.slot)
        self.assertEqual(self.claim(entry).status_code, 409)
        old.refresh_from_db()
        entry.refresh_from_db()
        self.assertEqual(old.status, "confirmed")
        self.assertEqual(entry.status, "offered")

    def test_claim_failure_rolls_back_cancellation_and_does_not_reoffer(self):
        old = self.make_reservation(self.make_slot(4))
        entry = self.make_entry(self.slot)
        error = DjangoValidationError({
            "__all__": DjangoValidationError("Conflicto", code="confirmed_slot_conflict"),
        })
        with patch("reservas.views.Reservation.objects.create", side_effect=error):
            with self.captureOnCommitCallbacks(execute=True) as callbacks:
                response = self.claim(entry)
        self.assertEqual(response.status_code, 400)
        self.assertIn("slot_id", response.data)
        self.assertEqual(callbacks, [])
        old.refresh_from_db()
        entry.refresh_from_db()
        self.assertEqual(old.status, "confirmed")
        self.assertEqual(entry.status, "offered")
        self.assertEqual(Reservation.objects.count(), 1)

    def test_claim_allows_existing_offer_from_inactive_template(self):
        old = self.make_reservation(self.make_slot(4))
        entry = self.make_entry(self.slot)
        ResourceTemplate.objects.filter(pk=self.template.pk).update(active=False)
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.claim(entry).status_code, 200)
        old.refresh_from_db()
        entry.refresh_from_db()
        self.assertEqual(old.status, "cancelled")
        self.assertEqual(entry.status, "booked")
        self.assertEqual(Reservation.objects.filter(status="confirmed").count(), 1)

    def test_offers_send_email_only_after_commit(self):
        entry = self.make_entry(status="waiting")
        with self.captureOnCommitCallbacks(execute=True):
            offer_slot_to_waitlist(self.slot)
            self.assertEqual(len(mail.outbox), 0)
        entry.refresh_from_db()
        self.assertEqual(entry.status, "offered")
        self.assertEqual(len(mail.outbox), 1)

    def test_public_email_failure_does_not_undo_confirmed_booking(self):
        with patch("reservas.serializers.send_mail", side_effect=RuntimeError("Mail failed")):
            with self.assertLogs("django.test", level="ERROR"):
                with self.captureOnCommitCallbacks(execute=True):
                    response = self.client.post(reverse("public-reservation-create"), self.public_payload())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Reservation.objects.filter(status="confirmed").count(), 1)

    def test_scheduler_expires_offer_and_reoffers_to_next_candidate(self):
        expired = self.make_entry(self.slot, email="old@example.com")
        WaitlistEntry.objects.filter(pk=expired.pk).update(
            offer_expires_at=timezone.now() - timedelta(minutes=1),
        )
        waiting = self.make_entry(status="waiting", email="next@example.com")
        from io import StringIO
        with self.captureOnCommitCallbacks(execute=True):
            call_command("process_waitlist", stdout=StringIO())
        expired.refresh_from_db()
        waiting.refresh_from_db()
        self.assertEqual(expired.status, "expired")
        self.assertEqual(waiting.status, "offered")
        self.assertEqual(waiting.offered_slot_id, self.slot.pk)
        self.assertEqual(len(mail.outbox), 1)


@skipUnless(connection.vendor == "postgresql", "La concurrencia requiere PostgreSQL")
@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PostgreSQLReservationConcurrencyTests(ReservationFixtures, TransactionTestCase):
    def race(self, *operations, synchronize_validation=False):
        start = Barrier(len(operations))
        validated = Barrier(len(operations))

        def synchronize(original):
            def validate(serializer, data):
                result = original(serializer, data)
                validated.wait(timeout=10)
                return result
            return validate

        def worker(operation):
            close_old_connections()
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SET lock_timeout = '5s'")
                    cursor.execute("SET statement_timeout = '15s'")
                start.wait(timeout=10)
                return operation()
            finally:
                connection.close()

        with ExitStack() as stack:
            if synchronize_validation:
                for serializer in (ReservationPublicSerializer, ReservationCreateSerializer):
                    stack.enter_context(patch.object(serializer, "validate", synchronize(serializer.validate)))
            with ThreadPoolExecutor(max_workers=len(operations)) as executor:
                futures = [executor.submit(worker, operation) for operation in operations]
                return [future.result(timeout=25) for future in futures]

    def public_request(self, number):
        return APIClient().post(reverse("public-reservation-create"), self.public_payload(number)).status_code

    def manual_request(self):
        client = APIClient()
        client.force_authenticate(self.user)
        return client.post(reverse("reservation-list"), {
            "slot_id": str(self.slot.pk), "patient_id": str(self.patient.pk),
        }).status_code

    def test_five_public_requests_create_one_booking(self):
        results = self.race(
            *(lambda number=number: self.public_request(number) for number in range(5)),
            synchronize_validation=True,
        )
        self.assertEqual(results.count(201), 1)
        self.assertEqual(results.count(400), 4)
        self.assertEqual(Reservation.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_manual_and_public_compete_for_same_slot(self):
        results = self.race(self.manual_request, lambda: self.public_request(1), synchronize_validation=True)
        self.assertEqual(sorted(results), [201, 400])
        self.assertEqual(Reservation.objects.count(), 1)

    def test_two_manual_requests_create_one_booking(self):
        results = self.race(self.manual_request, self.manual_request, synchronize_validation=True)
        self.assertEqual(sorted(results), [201, 400])
        self.assertEqual(Reservation.objects.count(), 1)

    def test_same_offer_can_be_claimed_only_once(self):
        entry = self.make_entry(self.slot)
        url = reverse("public-waitlist-claim", args=[entry.pk])
        results = self.race(*(lambda: APIClient().post(url).status_code for _ in range(2)))
        self.assertEqual(sorted(results), [200, 400])
        self.assertEqual(Reservation.objects.count(), 1)
        entry.refresh_from_db()
        self.assertEqual(entry.status, "booked")

    def test_simultaneous_cancellations_reoffer_only_once(self):
        reservation = self.make_reservation()
        self.make_entry(status="waiting", email="waiting@example.com")
        url = reverse("reservation-confirm", args=[reservation.confirmation_token])
        results = self.race(*(lambda: APIClient().get(url, {"cancel": "1"}).status_code for _ in range(2)))
        self.assertEqual(sorted(results), [200, 400])
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, "cancelled")
        self.assertEqual(WaitlistEntry.objects.filter(status="offered").count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_two_workers_offer_same_slot_only_once(self):
        first = self.make_entry(status="waiting", email="first@example.com")
        self.make_entry(status="waiting", email="second@example.com")
        self.race(*(lambda: offer_slot_to_waitlist(self.slot) for _ in range(2)))
        self.assertEqual(WaitlistEntry.objects.filter(status="offered").count(), 1)
        first.refresh_from_db()
        self.assertEqual(first.status, "offered")
        self.assertEqual(len(mail.outbox), 1)

    def test_different_slots_cannot_overwrite_same_candidate_offer(self):
        entry = self.make_entry(status="waiting")
        other_slot = self.make_slot(3)
        self.race(lambda: offer_slot_to_waitlist(self.slot), lambda: offer_slot_to_waitlist(other_slot))
        entry.refresh_from_db()
        self.assertEqual(entry.status, "offered")
        self.assertIn(entry.offered_slot_id, (self.slot.pk, other_slot.pk))
        self.assertEqual(len(mail.outbox), 1)

    def test_two_claims_for_same_patient_preserve_one_final_booking(self):
        old = self.make_reservation(self.make_slot(5))
        first = self.make_entry(self.slot)
        second = self.make_entry(self.make_slot(3))
        results = self.race(*(
            lambda entry=entry: APIClient().post(reverse("public-waitlist-claim", args=[entry.pk])).status_code
            for entry in (first, second)
        ))
        self.assertEqual(results, [200, 200])
        self.assertEqual(Reservation.objects.filter(status="confirmed").count(), 1)
        self.assertEqual(Reservation.objects.count(), 3)
        old.refresh_from_db()
        self.assertEqual(old.status, "cancelled")
