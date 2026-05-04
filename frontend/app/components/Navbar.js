import Link from "next/link"; // ← El ingrediente secreto
export default function Navbar() {
    return (
        <nav className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700">
            <Link href="/" className="text-xl font-bold text-blue-400 hover:opacity-80 transition-opacity">
                ReservaFácil
            </Link>

            <div className="flex gap-6">
                <Link
                    href="/reservar/demo"
                    className="hover:text-blue-400 transition-colors text-sm font-medium"
                >
                    Reservar Turno
                </Link>

                <Link
                    href="/dashboard"
                    className="hover:text-blue-400 transition-colors text-sm font-medium"
                >
                    Acceso Profesional
                </Link>
            </div>
        </nav>
    );
}