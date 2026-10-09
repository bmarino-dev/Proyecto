'use client'

import { useEffect, useState } from 'react'
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                        ← Volver al Panel
                    </Link>
                    <h1 className="text-3xl font-bold">Días Bloqueados / Ausencias</h1>
                </div>

                {/* BOTÓN PARA DESPLEGAR */}
                <button
                    onClick={() => setMostrandoForm(!mostrandoForm)}
                    className={`w-full mb-6 p-6 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center gap-3 font-bold text-lg
                        ${mostrandoForm ? 'bg-slate-800 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                >
                    {mostrandoForm ? '✕ Cancelar Creación' : '+ Agregar Nuevo Día Bloqueado'}
                </button>

                {/* FORMULARIO DESPLEGABLE */}
                {mostrandoForm && (
                    <form onSubmit={guardarAusencia} className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Motivo / Razón (ej: Vacaciones, Feriado)</label>
                                <input
                                    type="text" required
                                    placeholder="Ej: Congreso Médico, Vacaciones..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevaAusencia.reason}
                                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, reason: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Fecha de Inicio</label>
                                <input
                                    type="date" required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevaAusencia.start_date}
                                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, start_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Fecha de Fin (Opcional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevaAusencia.end_date}
                                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, end_date: e.target.value })}
                                />
                                <p className="text-xs text-slate-500 mt-2">Si es un solo día, podés dejarlo en blanco.</p>
                            </div>

                            <button type="submit" className="col-span-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/30 transition-all mt-4">
                                Confirmar y Bloquear Fecha
                            </button>
                        </div>
                    </form>
                )}

                {/* LISTA DE DÍAS BLOQUEADOS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <span className="text-blue-400">🚫</span> Días Inactivos
                    </h2>
                    <div className="grid gap-4">
                        {blackoutDates.length > 0 ? (
                            blackoutDates.map((b) => (
                                <div key={b.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex justify-between items-center group hover:border-blue-500/50 transition-all shadow-lg">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-xl">
                                            🛑
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">
                                                {b.reason || "Sin motivo"}
                                            </p>
                                            <p className="text-blue-400 text-sm">
                                                {formatearFecha(b.start_date)}
                                                {b.end_date && b.end_date !== b.start_date && (
                                                    <> <span className="text-slate-500">→</span> {formatearFecha(b.end_date)}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarAusencia(b.id)}
                                        className="opacity-0 group-hover:opacity-100 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        🗑️ Borrar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-slate-500">No tenés días bloqueados configurados.</p>
                                <p className="text-sm text-slate-600 mt-2">Los turnos en estas fechas no estarán disponibles para reserva.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
