import FormularioReserva from '@/app/components/FormularioReserva'
import { Icon } from "@/app/components/Visuals";

export default async function ReservaPage({ params }) {
    const { business_id } = await params;

    // 1. Pedimos los datos del médico (esto sigue siendo Server Side: rápido y sin parpadeo)
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

    // 2. Los slots los carga el cliente (FormularioReserva) para poder paginar dinámicamente.
    //    El Server Component solo pasa el business_id como prop.
    return (
        <div className="patient-page flex flex-col items-center text-ink">
            {/* Cabecera del Perfil */}
            <div className="professional-card w-full">
                <div className="professional-avatar rounded-full mx-auto mb-4 flex items-center justify-center uppercase">
                    {doctor.full_name?.[0] || "D"}
                </div>

                <h1 className="text-4xl font-semibold mb-2">{doctor.full_name}</h1>
                <p className="specialty-label font-medium uppercase">
                    {doctor.specialty_display || doctor.specialty}
                </p>

                <div className="professional-details flex justify-center text-secondary">
                    <span><Icon name="pin" /> {doctor.address || 'Consultorio Virtual'}</span>
                    <span><Icon name="phone" /> {doctor.phone || 'Sin teléfono'}</span>
                </div>
            </div>

            {/* FormularioReserva fetchea y pagina los slots internamente */}
            <FormularioReserva business_id={business_id} />
        </div>
    );
}

