import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Logo con gradiente */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="group flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                R
                            </div>
                            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                ReservaFácil
                            </span>
                        </Link>
                    </div>

                    {/* Links de Navegación (Centro) */}
                    <div className="hidden md:flex items-center space-x-10">
                        <Link href="/" className="text-[15px] font-bold text-slate-900 hover:text-blue-700 transition-colors">
                            Inicio
                        </Link>
                        <Link href="#" className="text-[15px] font-bold text-slate-900 hover:text-blue-700 transition-colors">
                            Acerca de
                        </Link>
                        <Link href="#" className="text-[15px] font-bold text-slate-900 hover:text-blue-700 transition-colors">
                            Ayuda
                        </Link>
                    </div>

                    {/* Acciones (Derecha) */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/login"
                            className="text-[15px] font-bold text-slate-900 hover:text-blue-700 transition-colors"
                        >
                            Acceso Profesional
                        </Link>

                        <Link
                            href="/signup"
                            className="bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transform transition-all active:scale-95 shadow-md shadow-blue-100"
                        >
                            Registrarse
                        </Link>
                    </div>

                </div>
            </div>
        </nav>
    );
}