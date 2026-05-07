'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Componente para secciones con animación al entrar en el viewport
function FadeInSection({ children }) {
    const [isVisible, setVisible] = useState(false);
    const [domRef, setDomRef] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setVisible(true);
                }
            });
        }, { threshold: 0.1 });

        if (domRef) observer.observe(domRef);
        return () => { if (domRef) observer.unobserve(domRef); };
    }, [domRef]);

    return (
        <div
            ref={setDomRef}
            className={`transition-all duration-[1200ms] ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
        >
            {children}
        </div>
    );
}

export default function DemoPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans selection:bg-blue-100 overflow-x-hidden">

            {/* 1. HERO SECTION */}
            <header className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-white">
                {/* Fondo Decorativo */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#eff6ff_0%,transparent_70%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

                <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                    <div className="animate-bounce-slow inline-block px-4 py-1.5 mb-8 text-xs font-bold tracking-[0.2em] text-blue-600 uppercase bg-blue-50 rounded-full border border-blue-100">
                        ReservaFácil v2.0 • Micro SaaS
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                        Tu agenda, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">en piloto automático.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                        Libérate del estrés de las reservas manuales. Una plataforma inteligente diseñada para psicólogos, nutricionistas y profesionales de la salud.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-5">
                        <Link href="/signup" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300 hover:-translate-y-1 active:scale-95 text-lg">
                            Empezar ahora — Gratis
                        </Link>
                        <Link href="#problem" className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all hover:border-slate-300 text-lg">
                            Ver cómo funciona
                        </Link>
                    </div>
                </div>

                {/* Elementos flotantes decorativos */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-slate-50 rounded-[100%] blur-3xl opacity-50" />
            </header>

            {/* 2. EL PROBLEMA */}
            <section id="problem" className="py-32 px-6 bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <FadeInSection>
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                                    ¿Tu WhatsApp parece un centro de llamadas?
                                </h2>
                                <p className="text-xl text-slate-500 mb-10 leading-relaxed font-light">
                                    Sabemos lo frustrante que es interrumpir una sesión para coordinar un turno o descubrir que un paciente olvidó su cita. El tiempo es tu activo más valioso.
                                </p>
                                <div className="space-y-6">
                                    {[
                                        { t: 'Pérdida de ingresos por inasistencias', desc: 'Los "no-shows" sin previo aviso afectan tu economía.' },
                                        { t: 'Gestión manual agotadora', desc: 'Mensajes a deshoras que rompen tu equilibrio vida-trabajo.' },
                                        { t: 'Errores de coordinación', desc: 'Superposición de turnos y confusiones evitables.' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white transition-colors duration-300">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-lg">
                                                ✕
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{item.t}</h4>
                                                <p className="text-slate-500 text-sm">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-red-100 to-orange-50 rounded-[3rem] blur-2xl opacity-40 animate-pulse" />
                                <div className="relative aspect-[4/3] bg-white rounded-[3rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex items-center justify-center group overflow-hidden border-b-8 border-r-4">
                                    <div className="text-center p-12">
                                        <div className="text-6xl mb-6">😫</div>
                                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                                            Espacio para Imagen: <br /> El Caos de la Gestión Manual
                                        </p>
                                    </div>
                                    <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button className="bg-white px-6 py-3 rounded-xl font-bold shadow-xl">Ver Detalle</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* 3. LA SOLUCIÓN */}
            <section className="py-32 px-6 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <FadeInSection>
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="order-2 lg:order-1 relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[3rem] blur-2xl opacity-40" />
                                <div className="relative aspect-[4/3] bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex items-center justify-center group overflow-hidden border-b-8 border-r-4 border-blue-600/30">
                                    <div className="text-center p-12">
                                        <div className="text-6xl mb-6">✨</div>
                                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                                            Espacio para Imagen: <br /> Dashboard Limpio y Moderno
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                                    Automatización que se siente <span className="text-blue-600 italic">natural.</span>
                                </h2>
                                <p className="text-xl text-slate-500 mb-10 leading-relaxed font-light">
                                    Tus pacientes acceden a un link personalizado, eligen el horario disponible y listo. Sin llamadas, sin mensajes, sin fricción.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200">🚀</div>
                                        <h4 className="font-bold text-xl text-slate-900">Auto-Service 24/7</h4>
                                        <p className="text-slate-500 leading-relaxed">Permite que tus pacientes reserven incluso mientras descansas.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-200">📬</div>
                                        <h4 className="font-bold text-xl text-slate-900">Confirmación Email</h4>
                                        <p className="text-slate-500 leading-relaxed">Envío automático de detalles y enlaces de cancelación a un clic.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* 4. FEATURES DESTACADAS */}
            <section className="py-32 px-6 bg-slate-900 text-white relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#1e3a8a_0%,transparent_50%)] opacity-30" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <FadeInSection>
                        <div className="text-center max-w-3xl mx-auto mb-24">
                            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight italic">
                                Potencia tu práctica <br />al siguiente nivel.
                            </h2>
                            <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full mb-8" />
                            <p className="text-slate-400 text-xl font-light">
                                Desarrollado con tecnología de punta para garantizar una experiencia fluida tanto para ti como para tu paciente.
                            </p>
                        </div>
                    </FadeInSection>

                    <div className="grid md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: '📋',
                                title: 'Waitlist Inteligente',
                                color: 'bg-blue-600',
                                desc: 'Si un paciente cancela, el sistema avisa por orden FIFO al siguiente en la lista de espera para que tome el lugar.'
                            },
                            {
                                icon: '⚡',
                                title: 'Generación Masiva',
                                color: 'bg-indigo-600',
                                desc: 'Crea miles de slots mensuales en segundos basándote en plantillas flexibles de días y horarios.'
                            },
                            {
                                icon: '🔐',
                                title: 'Race Condition Proof',
                                color: 'bg-emerald-600',
                                desc: 'Olvídate de las reservas dobles. Nuestro motor backend bloquea transacciones concurrentes con precisión atómica.'
                            }
                        ].map((card, i) => (
                            <FadeInSection key={i}>
                                <div className="group h-full p-10 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 hover:-translate-y-4">
                                    <div className={`w-16 h-16 ${card.color} rounded-2xl mb-8 flex items-center justify-center text-3xl shadow-xl shadow-slate-900 group-hover:scale-110 transition-transform`}>
                                        {card.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-6 group-hover:text-blue-400 transition-colors">{card.title}</h3>
                                    <p className="text-slate-400 leading-relaxed font-light">
                                        {card.desc}
                                    </p>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. FOOTER / FINAL CTA */}
            <section className="py-32 px-6 bg-slate-50 text-center relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <FadeInSection>
                        <div className="py-24 px-8 md:px-16 bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 rounded-[4rem] text-white shadow-[0_40px_80px_-20px_rgba(37,99,235,0.4)] relative group overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                            <div className="relative z-10">
                                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                                    Empieza hoy <br className="hidden md:block" />mismo.
                                </h2>
                                <p className="text-blue-100 text-xl mb-12 max-w-xl mx-auto font-light leading-relaxed">
                                    No requiere tarjeta de crédito. Configura tu consultorio virtual en menos de 5 minutos.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-6">
                                    <Link href="/signup" className="bg-white text-slate-900 px-12 py-5 rounded-2xl font-bold hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 text-lg">
                                        Crear mi cuenta gratuita
                                    </Link>
                                    <Link href="/login" className="bg-transparent border-2 border-white/30 text-white px-12 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all text-lg">
                                        Acceso Profesional
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            <footer className="py-16 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">ReservaFácil</span>
                    </div>
                    <nav className="flex gap-8 text-slate-500 font-medium text-sm">
                        <Link href="#" className="hover:text-blue-600 transition-colors">Términos</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">Privacidad</Link>
                        <Link href="#" className="hover:text-blue-600 transition-colors">Contacto</Link>
                    </nav>
                    <p className="text-slate-400 text-sm font-light">
                        &copy; 2026 • Diseñado con ❤️ para profesionales.
                    </p>
                </div>
            </footer>

            {/* Estilos adicionales para animaciones CSS */}
            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(0); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite;
                }
            `}</style>
        </div>
    );
}
