'use client'

import { useEffect, useState } from 'react'
import { Icon } from "@/app/components/Visuals";
import Link from 'next/link'
import { apiFetch } from '@/app/lib/api'

export default function AusenciasPage() {
    const [blackoutDates, setBlackoutDates] = useState([])
    const [cargando, setCargando] = useState(true)

    // Estados para el formulario
    const [mostrandoForm, setMostrandoForm] = useState(false)
    const [nuevaAusencia, setNuevaAusencia] = useState({
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        reason: '',
    })

    useEffect(() => {
        cargarBlackouts()
    }, [])

    async function cargarBlackouts() {
        try {
            const todasLasAusencias = []
            let url = 'http://localhost:8001/blackouts/'

            while (url) {
                const res = await apiFetch(url)

                if (!res.ok) {
                    throw new Error(
                        `Error al cargar ausencias: ${res.status}`
                    )
                }

                const data = await res.json()
                todasLasAusencias.push(...(data.results ?? data))
                url = data.next ?? null
            }

            setBlackoutDates(todasLasAusencias)

        } catch (error) {
            console.error("Error cargando Blackout Dates:", error)
        } finally {
            setCargando(false)
        }
    }

    const guardarAusencia = async (e) => {
        e.preventDefault()

        try {
            // Si no hay end_date, mandamos null o el mismo start_date
            const payload = {
                start_date: nuevaAusencia.start_date,
                end_date: nuevaAusencia.end_date || nuevaAusencia.start_date,
                reason: nuevaAusencia.reason || "Ausencia",
            }

            // Validación: end_date no puede ser anterior a start_date
            if (payload.end_date < payload.start_date) {
                alert("La fecha de fin no puede ser anterior a la de inicio.")
                return
            }

            console.log("Enviando datos...", payload)

            const res = await apiFetch('http://localhost:8001/blackouts/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setMostrandoForm(false)
                cargarBlackouts() // Refrescamos la lista
                // Limpiamos el formulario
                setNuevaAusencia({
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    reason: ''
                })
            } else {
                const error = await res.json()
                alert("Error al guardar: " + JSON.stringify(error))
            }
        } catch (error) {
            console.error("Error de red:", error)
            alert("Error de conexión con el servidor")
        }
    }

    const eliminarAusencia = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este día bloqueado?")) return;
        try {
            const res = await apiFetch(`http://localhost:8001/blackouts/${id}/`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setBlackoutDates(blackoutDates.filter(t => t.id !== id))
            }
        } catch (error) {
            alert("Error al eliminar")
        }
    }

    const formatearFecha = (fechaStr) => {
        if (!fechaStr) return ''
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // Ajuste para evitar problemas de zona horaria al parsear YYYY-MM-DD
        const [year, month, day] = fechaStr.split('-')
        const fecha = new Date(year, month - 1, day)
        return fecha.toLocaleDateString('es-ES', opciones)
    }

    if (cargando) {
        return (
            <div className="min-h-screen bg-canvas flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand/20 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="app-page">
            <div className="app-container max-w-4xl">
                <div className="management-header">
                    <Link href="/dashboard" className="text-secondary hover:text-ink transition-colors flex items-center gap-2">
                        ← Volver al panel
                    </Link>
                    <h1 className="text-3xl font-semibold">Ausencias y vacaciones</h1>
                </div>

                {/* BOTÓN PARA DESPLEGAR */}
                <button
                    onClick={() => setMostrandoForm(!mostrandoForm)}
                    className={` management-toggle w-full mb-6 p-6 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center gap-3 font-semibold text-lg ${mostrandoForm ? 'bg-surface border-brand/20 text-brand' : 'bg-surface border-line text-secondary hover:border-line hover:text-ink'}  `}
                >
                    {mostrandoForm ? '✕ Cancelar Creación' : '+ Agregar Nuevo Día Bloqueado'}
                </button>

                {/* FORMULARIO DESPLEGABLE */}
                {mostrandoForm && (
                    <form onSubmit={guardarAusencia} className="management-form bg-surface border border-brand/20 rounded-3xl p-8 mb-12 shadow-card duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label htmlFor="field-setting-1" className="block text-sm font-medium text-secondary mb-2">Motivo / Razón (ej: Vacaciones, Feriado)</label>
                                <input id="field-setting-1"
                                    type="text" required
                                    placeholder="Ej: Congreso Médico, Vacaciones..."
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
                                    value={nuevaAusencia.reason}
                                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, reason: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="field-setting-2" className="block text-sm font-medium text-secondary mb-2">Fecha de Inicio</label>
                                <input id="field-setting-2"
                                    type="date" required
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
                                    value={nuevaAusencia.start_date}
                                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, start_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="field-setting-3" className="block text-sm font-medium text-secondary mb-2">Fecha de Fin (Opcional)</label>
                                <input id="field-setting-3"
                                    type="date"
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
                                    value={nuevaAusencia.end_date}
                                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, end_date: e.target.value })}
                                />
                                <p className="text-xs text-secondary mt-2">Si es un solo día, podés dejarlo en blanco.</p>
                            </div>

                            <button type="submit" className="col-span-full bg-brand hover:bg-brand-dark text-white font-semibold py-4 rounded-2xl shadow-card transition-all mt-4">
                                Confirmar y Bloquear Fecha
                            </button>
                        </div>
                    </form>
                )}

                {/* LISTA DE DÍAS BLOQUEADOS */}
                <div className="management-list bg-surface border border-line">
                    <h2 className="text-xl font-semibold mb-8 flex items-center gap-3">
                        <span className="text-brand"><Icon name="close" /></span> Días de ausencia
                    </h2>
                    <div className="grid gap-4">
                        {blackoutDates.length > 0 ? (
                            blackoutDates.map((b) => (
                                <div key={b.id} className="management-row border border-line flex justify-between items-center group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-danger-soft rounded-full flex items-center justify-center text-xl">
                                            <Icon name="close" />
                                        </div>
                                        <div>
                                            <p className="text-ink font-semibold text-lg">
                                                {b.reason || "Sin motivo"}
                                            </p>
                                            <p className="text-brand text-sm">
                                                {formatearFecha(b.start_date)}
                                                {b.end_date && b.end_date !== b.start_date && (
                                                    <> <span className="text-secondary">→</span> {formatearFecha(b.end_date)}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarAusencia(b.id)}
                                        className="delete-button text-danger hover:bg-danger-soft rounded-xl"
                                    >
                                        <Icon name="trash" /> Borrar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state text-center">
                                <p className="text-secondary">No tenés días bloqueados configurados.</p>
                                <p className="text-sm text-secondary mt-2">Los turnos en estas fechas no estarán disponibles para reserva.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
