export default function Navbar() {
    return (
        <nav className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-bold text-blue-400">ReservaFácil</span>
            <div className="flex gap-4">
                <a href="/reservar" className="hover:text-blue-400 transition-colors">Reservar Turno</a>
                <a href="/dashboard" className="hover:text-blue-400 transition-colors">Acceso Profesional</a>
            </div>
        </nav>
    );
}