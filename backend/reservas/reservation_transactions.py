"""Transacciones de reservas con respuestas entendibles ante conflictos."""

from contextlib import contextmanager

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, connection, transaction
from rest_framework.exceptions import ValidationError


CONFIRMED_SLOT_CONSTRAINT = "unique_confirmed_reservation_per_slot"
CONFLICT_MESSAGE = "Este turno acaba de ser reservado. Elegí otro turno."


@contextmanager
def reservation_transaction():
    # Capturamos los errores después de salir del atomic: los cambios ya se
    # revirtieron y la conexión puede volver a usarse.
    try:
        with transaction.atomic():
            yield
    except DjangoValidationError as error:
        if any(
            item.code == "confirmed_slot_conflict"
            for errors in getattr(error, "error_dict", {}).values()
            for item in errors
        ):
            raise ValidationError({"slot_id": CONFLICT_MESSAGE}) from error
        detail = getattr(error, "message_dict", None)
        if detail is None:
            detail = {"non_field_errors": error.messages}
        else:
            detail = {
                "non_field_errors" if key == "__all__" else key: value
                for key, value in detail.items()
            }
        raise ValidationError(detail) from error
    except IntegrityError as error:
        diagnostic = getattr(error.__cause__, "diag", None)
        is_slot_conflict = (
            getattr(diagnostic, "constraint_name", None)
            == CONFIRMED_SLOT_CONSTRAINT
        )
        if connection.vendor == "sqlite":
            is_slot_conflict = str(error) == (
                "UNIQUE constraint failed: reservas_reservation.slot_id"
            )
        if is_slot_conflict:
            raise ValidationError({"slot_id": CONFLICT_MESSAGE}) from error
        # Otros errores de integridad necesitan investigarse, no se presentan
        # como si otro paciente hubiera ocupado el turno.
        raise
