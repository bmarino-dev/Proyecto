'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Dashboard() {
    const [reservas, setReservas] = useState([])
    const [perfil, setPerfil] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')

        async function cargarDatos() {
            if (!token) {
                setCargando(false)
                return
            }

            try {
                const [resPerfil, resReservas] = await Promise.all([
                    fetch('http://localhost:8001/business/me/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch('http://localhost:8001/reservations/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ])

                if (resPerfil.ok) {
                    setPerfil(await resPerfil.json())
                }
                if (resReservas.ok) {
                    const data = await resReservas.json()
                    setReservas(data.results || data)
                }
            } catch (error) {
                console.error("Error cargando dashboard", error)
            } finally {
                setCargando(false)
            }
        }

        cargarDatos()
    }, [])

    if (cargando) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-5xl mx-auto">
                {perfil ? (
                    // --- VISTA: PROFESIONAL LOGUEADO ---
                    <>
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tight">
                                    ¡Hola, {perfil.full_name}!
                                </h1>
                                <p className="text-slate-400 mt-2 text-lg">Gestioná tu agenda y pacientes desde acá.</p>
                            </div>

                            <Link
                                href={`/reservar/${perfil.id}`}
                                target="_blank"
                                className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/30"
                            >
                                <span>🌐 Ver Mi Agenda Pública</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            <Link href="/dashboard/horarios" className="relative overflow-hidden group bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all shadow-xl text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⏰</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Configurar Horarios</h3>
                                        <p className="text-slate-400 text-sm mt-1">Definí tus días y horas de atención semanal.</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/ausencias" className="relative overflow-hidden group bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-red-500/50 transition-all shadow-xl text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🌴</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Bloquear Fechas</h3>
                                        <p className="text-slate-400 text-sm mt-1">Marcá tus vacaciones o días de ausencia.</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">📅</span>
                                Próximos Turnos
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reservas.length > 0 ? (
                                    reservas.map((reserva) => (
                                        <div key={reserva.id} className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl transition-all shadow-lg hover:shadow-blue-900/20">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl text-white font-bold">
                                                    {reserva.reservation_firstname?.charAt(0) || "P"}
                                                </div>
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium uppercase tracking-wider">
                                                    {reserva.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">
                                                {reserva.reservation_firstname} {reserva.reservation_lastname}
                                            </h3>
                                            {reserva.reservation_phone && (
                                                <p className="text-slate-400 text-sm flex items-center gap-1">
                                                    <span className="text-xs">📞</span> {reserva.reservation_phone}
                                                </p>
                                            )}
                                            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-blue-400">
                                                <span className="text-lg">🕒</span>
                                                <span className="font-mono font-medium">
                                                    {reserva.slot.date} • {reserva.slot.start_datetime.substring(11, 16)} hs
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                                        <p className="text-slate-400 text-lg">No hay turnos pendientes por el momento.</p>
                                        <p className="text-slate-500 text-sm mt-2">¡Aprovechá para descansar!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    // --- VISTA: USUARIO NO LOGUEADO (Invitación) ---
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-900 border border-slate-800 rounded-3xl p-12 shadow-2xl">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce">
                            🚀
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">¿Sos profesional de la salud?</h2>
                        <p className="text-slate-400 text-xl max-w-lg mb-10 leading-relaxed">
                            Gestioná tus turnos de forma automática, profesional y sin complicaciones. Todo en un solo lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md justify-center">
                            <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all text-lg shadow-lg shadow-blue-900/30">
                                Iniciar Sesión
                            </Link>
                            <Link href="/signup" className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-4 rounded-2xl font-bold transition-all text-lg border border-slate-700">
                                Crear Cuenta
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
