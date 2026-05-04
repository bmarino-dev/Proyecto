export default async function ReservaPage({ params }) {
    const { business_id } = await params;
    // 1. Le pedimos los datos a Django
    const response = await fetch(`http://localhost:8001/public/business/${business_id}/`, {
        cache: 'no-store' // Para que no guarde basura y siempre pida datos frescos
    });
    // 2. Si el médico no existe (404), mostramos un error lindo
    if (!response.ok) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <h1 className="text-2xl font-bold text-red-400">Ups! Profesional no encontrado</h1>
                <p className="text-slate-400">Verificá el link e intentá de nuevo.</p>
            </div>
        );
    }
    // 3. Convertimos la respuesta de Django a un objeto JS
    const doctor = await response.json();
    return (
        <div className="flex flex-col items-center p-8 text-white max-w-4xl mx-auto">
            {/* Cabecera del Perfil */}
            <div className="bg-slate-800 w-full p-8 rounded-3xl border border-slate-700 shadow-xl text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
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
            {/* Aquí es donde irán los turnos más adelante */}
            <div className="mt-12 w-full">
                <h2 className="text-2xl font-bold mb-6 text-center">Próximos Turnos Disponibles</h2>
                <div className="bg-slate-800/30 p-12 rounded-3xl border border-dashed border-slate-700 text-center">
                    <p className="text-slate-500 italic">Cargando agenda...</p>
                </div>
            </div>
        </div>
    );
}