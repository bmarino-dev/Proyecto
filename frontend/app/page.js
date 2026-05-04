import Link from "next/link"; // ← Importante: el portal de Next.js

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Sección Hero */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6">
        Gestioná tus turnos <br />
        <span className="text-blue-500">sin complicaciones.</span>
      </h1>

      <p className="text-xl text-slate-400 max-w-2xl mb-10">
        La plataforma ideal para profesionales que buscan automatizar su agenda y
        ofrecer una mejor experiencia a sus pacientes.
      </p>

      {/* Botones de Acción */}
      <div className="flex gap-4">
        <Link
          href="/reservar/ejemplo-doctor"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all"
        >
          Ver Demo Pública
        </Link>

        <Link
          href="/dashboard"
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full border border-slate-700 transition-all"
        >
          Panel Profesional
        </Link>
      </div>

      {/* Un pequeño detalle decorativo */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl">
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h3 className="text-blue-400 font-bold mb-2">🚀 Rápido</h3>
          <p className="text-slate-400 text-sm">Reservas en menos de 30 segundos para tus pacientes.</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h3 className="text-blue-400 font-bold mb-2">🤖 Automático</h3>
          <p className="text-slate-400 text-sm">Generación de slots y lista de espera inteligente.</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h3 className="text-blue-400 font-bold mb-2">📧 Notificaciones</h3>
          <p className="text-slate-400 text-sm">Emails automáticos de confirmación y cancelación.</p>
        </div>
      </div>
    </div>
  );
}

