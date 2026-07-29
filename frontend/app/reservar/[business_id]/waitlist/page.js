import FormularioWaitlist from '@/app/components/FormularioWaitlist'
import Link from 'next/link'

export default async function WaitlistPage({ params }) {
    const { business_id } = await params;

    // Fetch de datos del profesional
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

    return (
        <div className="flex flex-col items-center p-8 text-white max-w-4xl mx-auto space-y-8">
            {/* Header del profesional */}
            <div className="bg-slate-800 w-full p-8 rounded-3xl border border-slate-700 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-4 left-4">
                    <Link
                        href={`/reservar/${business_id}`}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700/60 transition-colors"
                    >
                        ← Volver a Reservas
                    </Link>
                </div>

                <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold uppercase shadow-lg shadow-purple-900/30 border-2 border-purple-400/30">
                    {doctor.full_name?.[0] || "D"}
                </div>

                <h1 className="text-3xl font-bold mb-1">{doctor.full_name}</h1>
                <p className="text-purple-400 font-medium uppercase tracking-widest text-xs mb-4">
                    {doctor.specialty_display || doctor.specialty}
                </p>

                <div className="flex justify-center gap-4 text-slate-400 text-sm">
                    <span>📍 {doctor.address || 'Consultorio Virtual'}</span>
                    <span>📞 {doctor.phone || 'Sin teléfono'}</span>
                </div>
            </div>

            {/* Formulario interactivo de Waitlist */}
            <FormularioWaitlist business_id={business_id} />
        </div>
    );
}
