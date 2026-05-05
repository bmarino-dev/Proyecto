import FormularioReserva from '@/app/components/FormularioReserva'

export default async function ReservaPage({ params }) {
    const { business_id } = await params;

    // 1. Pedimos los datos del médico
    const response = await fetch(`http://localhost:8001/public/business/${business_id}/`, {
        cache: 'no-store'
    });

    if (!response.ok) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <h1 className="text-2xl font-bold text-red-400">Ups! Profesional no encontrado</h1>
                <p className="text-slate-400">Verificá el link e intentá de nuevo.</p>
            </div>
        );
    }

    const doctor = await response.json();

    // 2. Pedimos los turnos (slots) disponibles
    const responseSlots = await fetch(`http://localhost:8001/public/slots/?business_id=${business_id}`, {
        cache: 'no-store'
    });

    const dataSlots = await responseSlots.json();

    // EXPLICACIÓN: Si Django usa paginación, los turnos vienen en .results
    // Si no, vienen directo en el objeto. Esto cubre ambos casos:
    const slots = dataSlots.results || dataSlots;

    return (
        <div className="flex flex-col items-center p-8 text-white max-w-4xl mx-auto">
            {/* Cabecera del Perfil */}
            <div className="bg-slate-800 w-full p-8 rounded-3xl border border-slate-700 shadow-xl text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold uppercase">
                    {doctor.full_name?.[0] || "D"}
                </div>

                <h1 className="text-4xl font-bold mb-2">{doctor.full_name}</h1>
                <p className="text-blue-400 font-medium uppercase tracking-widest text-sm">
                    {doctor.specialty_display || doctor.specialty}
                </p>

                <div className="mt-6 flex justify-center gap-4 text-slate-400 text-sm">
                    <span>📍 {doctor.address || 'Consultorio Virtual'}</span>
                    <span>📞 {doctor.phone || 'Sin teléfono'}</span>
                </div>
            </div>

            {/* Le pasamos los slots y el business_id al componente interactivo */}
            <FormularioReserva slots={slots} business_id={business_id} />
        </div>
    );
}
