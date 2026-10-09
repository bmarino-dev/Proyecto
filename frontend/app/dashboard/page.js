'use client'

import { useEffect, useState } from 'react'
import { Icon } from "@/app/components/Visuals";
import Link from 'next/link'
import { apiFetch } from '@/app/lib/api'

export default function Dashboard() {
    const [reservas, setReservas] = useState([])
    const [perfil, setPerfil] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        async function cargarDatos() {
            try {
                const [resPerfil, resReservas] = await Promise.all([
                    apiFetch('http://localhost:8001/business/me/'),
                    apiFetch('http://localhost:8001/reservations/')
                ])

                if (resPerfil.ok) {
                    setPerfil(await resPerfil.json())
                }
                const todasLasReservas = []
                let respuesta = resReservas

                while (respuesta) {
                    if (!respuesta.ok) {
                        throw new Error(
                            `Error al cargar reservas: ${respuesta.status}`
                        )
                    }

                    const data = await respuesta.json()
                    todasLasReservas.push(...(data.results ?? data))

                    respuesta = data.next
                        ? await apiFetch(data.next)
                        : null
                }

                setReservas(todasLasReservas)
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
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand/20 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="app-page">
            <div className="app-container">
                {perfil ? (
                    // --- VISTA: PROFESIONAL LOGUEADO ---
                    <>
                        <header className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="panel-kicker"><span className="status-dot" /> MI CONSULTORIO</div>
                                <h1 className="page-heading">
                                    ¡Hola, {perfil.full_name}!
                                </h1>
                                <p className="text-secondary mt-2 text-lg">Tu agenda, en orden. Tu tiempo, para tus pacientes.</p>
                            </div>

                            <Link
                                href={`/reservar/${perfil.id}`}
                                target="_blank"
                                className="group flex items-center gap-3 bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-card"
                            >
                                <span><Icon name="globe" /> Ver agenda pública</span>
                                <span className="transition-transform">→</span>
                            </Link>
                        </header>

                        <div className="dashboard-shortcuts grid grid-cols-1 md:grid-cols-2">
                            <Link href="/dashboard/horarios" className="dashboard-shortcut relative overflow-hidden group bg-surface border border-line p-8 rounded-3xl hover:border-brand/20 transition-all shadow-card text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center text-2xl transition-transform"><Icon name="clock" /></div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-ink">Horarios de atención</h3>
                                        <p className="text-secondary text-sm mt-1">Definí tus días y horas de atención semanal.</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/dashboard/ausencias" className="dashboard-shortcut relative overflow-hidden group bg-surface border border-line p-8 rounded-3xl hover:border-danger/20 transition-all shadow-card text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-danger-soft rounded-2xl flex items-center justify-center text-2xl transition-transform"><Icon name="leaf" /></div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-ink">Ausencias y vacaciones</h3>
                                        <p className="text-secondary text-sm mt-1">Marcá tus vacaciones o días de ausencia.</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="appointments-panel bg-surface border border-line">
                            <h2 className="text-xl font-semibold text-ink mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-brand"><Icon name="calendar" /></span>
                                Tus turnos
                            </h2>

                            <div className="appointments-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {reservas.length > 0 ? (
                                    reservas.map((reserva) => (
                                        <div key={reserva.id} className="appointment-card border border-line">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="patient-avatar w-12 h-12 rounded-full flex items-center justify-center">
                                                    {reserva.reservation_firstname?.charAt(0) || "P"}
                                                </div>
                                                <span className="status-label px-3 py-1 bg-brand-soft text-brand border border-brand/20 rounded-full text-xs font-medium uppercase tracking-wider">
                                                    {reserva.status}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-ink mb-1">
                                                {reserva.reservation_firstname} {reserva.reservation_lastname}
                                            </h3>
                                            {reserva.reservation_phone && (
                                                <p className="text-secondary text-sm flex items-center gap-1">
                                                    <span className="text-xs"><Icon name="phone" /></span> {reserva.reservation_phone}
                                                </p>
                                            )}
                                            <div className="mt-4 pt-4 border-t border-line flex items-center gap-2 text-brand">
                                                <span className="text-lg"><Icon name="clock" /></span>
                                                <span className="font-mono font-medium">
                                                    {reserva.slot.date} • {reserva.slot.start_datetime.substring(11, 16)} hs
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state col-span-full text-center">
                                        <p className="text-secondary text-lg">No hay turnos pendientes por el momento.</p>
                                        <p className="text-secondary text-sm mt-2">¡Aprovechá para descansar!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    // --- VISTA: USUARIO NO LOGUEADO (Invitación) ---
                    <div className="feedback-card flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-brand-soft rounded-full flex items-center justify-center text-5xl mb-8">
                            <Icon name="leaf" />
                        </div>
                        <h2 className="text-4xl font-semibold text-ink mb-4">¿Sos profesional de la salud?</h2>
                        <p className="text-secondary text-xl max-w-lg mb-10 leading-relaxed">
                            Gestioná tus turnos de forma automática, profesional y sin complicaciones. Todo en un solo lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md justify-center">
                            <Link href="/login" className="bg-brand hover:bg-brand-dark text-white px-10 py-4 rounded-2xl font-semibold transition-all text-lg shadow-card">
                                Iniciar Sesión
                            </Link>
                            <Link href="/signup" className="bg-surface hover:bg-muted text-ink px-10 py-4 rounded-2xl font-semibold transition-all text-lg border border-line">
                                Crear Cuenta
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
