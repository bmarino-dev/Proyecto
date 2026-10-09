import FormularioWaitlist from '@/app/components/FormularioWaitlist'
import { Icon } from "@/app/components/Visuals";
import Link from 'next/link'

export default async function WaitlistPage({ params }) {
    const { business_id } = await params;

    // Fetch de datos del profesional
    const response = await fetch(`http://localhost:8001/public/business/${business_id}/`, {
        cache: 'no-store'
    });

    if (!response.ok) {
        return (
            <div className="feedback-screen flex flex-col items-center justify-center text-ink">
                <h1 className="text-2xl font-semibold text-danger">Ups! Profesional no encontrado</h1>
                <p className="text-secondary">Verificá el link e intentá de nuevo.</p>
            </div>
        );
    }

    const doctor = await response.json();

    return (
        <div className="patient-page flex flex-col items-center text-ink space-y-8">
            {/* Header del profesional */}
            <div className="professional-card w-full">
                <div className="professional-back">
                    <Link
                        href={`/reservar/${business_id}`}
                        className="inline-flex items-center gap-2 text-secondary hover:text-ink text-sm bg-surface px-4 py-2 rounded-xl border border-line transition-colors"
                    >
                        ← Volver a Reservas
                    </Link>
                </div>

                <div className="professional-avatar rounded-full mx-auto mb-4 flex items-center justify-center uppercase">
                    {doctor.full_name?.[0] || "D"}
                </div>

                <h1 className="text-3xl font-semibold mb-1">{doctor.full_name}</h1>
                <p className="specialty-label font-medium uppercase">
                    {doctor.specialty_display || doctor.specialty}
                </p>

                <div className="professional-details flex justify-center text-secondary">
                    <span><Icon name="pin" /> {doctor.address || 'Consultorio Virtual'}</span>
                    <span><Icon name="phone" /> {doctor.phone || 'Sin teléfono'}</span>
                </div>
            </div>

            {/* Formulario interactivo de Waitlist */}
            <FormularioWaitlist business_id={business_id} />
        </div>
    );
}
