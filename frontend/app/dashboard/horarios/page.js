'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DIAS = {
    0: 'Lunes',
    1: 'Martes',
    2: 'Miércoles',
    3: 'Jueves',
    4: 'Viernes',
    5: 'Sábado',
    6: 'Domingo'
}

export default function HorariosPage() {
    const [templates, setTemplates] = useState([])
    const [cargando, setCargando] = useState(true)

    // Estados para el formulario
    const [mostrandoForm, setMostrandoForm] = useState(false)
    const [nuevoHorario, setNuevoHorario] = useState({
        name: '',
        weekday: '1',
        start_time: '09:00',
        end_time: '13:00',
        duration: '00:30:00'
    })

    useEffect(() => {
        cargarTemplates()
    }, [])

    async function cargarTemplates() {
        const token = localStorage.getItem('token')
        try {
            const res = await fetch('http://localhost:8001/templates/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setTemplates(data.results || data)
            }
        } catch (error) {
            console.error("Error cargando templates:", error)
        } finally {
            setCargando(false)
        }
    }

    const guardarHorario = async (e) => {
        e.preventDefault()

        // Validación básica de horas
        if (nuevoHorario.start_time >= nuevoHorario.end_time) {
            alert("La hora de fin debe ser posterior a la de inicio.")
            return
        }

        const token = localStorage.getItem('token')

        try {
            // Preparamos el paquete de datos EXACTO que espera Django
            const payload = {
                name: nuevoHorario.name,
                weekday: parseInt(nuevoHorario.weekday), // Lo convertimos a número (0-6)
                start_time: nuevoHorario.start_time,
                end_time: nuevoHorario.end_time,
                duration: nuevoHorario.duration
            }

            console.log("Enviando datos...", payload)

            const res = await fetch('http://localhost:8001/templates/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setMostrandoForm(false)
                cargarTemplates() // Refrescamos la lista
                // Limpiamos el formulario
                setNuevoHorario({ name: '', weekday: '0', start_time: '09:00', end_time: '13:00', duration: '00:30:00' })
            } else {
                const error = await res.json()
                alert("Error al guardar: " + JSON.stringify(error))
            }
        } catch (error) {
            console.error("Error de red:", error)
            alert("Error de conexión con el servidor")
        }
    }


    const eliminarTemplate = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este horario?")) return;
        const token = localStorage.getItem('token')
        try {
            const res = await fetch(`http://localhost:8001/templates/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                setTemplates(templates.filter(t => t.id !== id))
            }
        } catch (error) {
            alert("Error al eliminar")
        }
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
                    <h1 className="text-3xl font-bold">Mis Horarios de Atención</h1>
                </div>

                {/* BOTÓN PARA DESPLEGAR */}
                <button
                    onClick={() => setMostrandoForm(!mostrandoForm)}
                    className={`w-full mb-6 p-6 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center gap-3 font-bold text-lg
                        ${mostrandoForm ? 'bg-slate-800 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                >
                    {mostrandoForm ? '✕ Cancelar Creación' : '+ Agregar Nuevo Horario Semanal'}
                </button>

                {/* FORMULARIO DESPLEGABLE */}
                {mostrandoForm && (
                    <form onSubmit={guardarHorario} className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del Horario (ej: Lunes Mañana)</label>
                                <input
                                    type="text" required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevoHorario.name}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Día de la Semana</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevoHorario.weekday}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, weekday: e.target.value })}
                                >
                                    <option value="0">Lunes</option>
                                    <option value="1">Martes</option>
                                    <option value="2">Miércoles</option>
                                    <option value="3">Jueves</option>
                                    <option value="4">Viernes</option>
                                    <option value="5">Sábado</option>
                                    <option value="6">Domingo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Duración de cada Turno</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevoHorario.duration}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, duration: e.target.value })}
                                >
                                    <option value="00:15:00">15 Minutos</option>
                                    <option value="00:30:00">30 Minutos</option>
                                    <option value="00:45:00">45 Minutos</option>
                                    <option value="01:00:00">1 Hora</option>
                                    <option value="01:15:00">1 Hora y 15 Minutos</option>
                                    <option value="01:30:00">1 Hora y 30 Minutos</option>
                                    <option value="01:45:00">1 Hora y 45 Minutos</option>
                                    <option value="02:00:00">2 Horas</option>

                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Hora de Inicio</label>
                                <input
                                    type="time" required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevoHorario.start_time}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, start_time: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Hora de Fin</label>
                                <input
                                    type="time" required
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none"
                                    value={nuevoHorario.end_time}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, end_time: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="col-span-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/30 transition-all mt-4">
                                Confirmar y Guardar Horario
                            </button>
                        </div>
                    </form>
                )}

                {/* LISTA DE HORARIOS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <span className="text-blue-400">📋</span> Horarios Activos
                    </h2>
                    <div className="grid gap-4">
                        {templates.length > 0 ? (
                            templates.map((t) => (
                                <div key={t.id} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex justify-between items-center group hover:border-blue-500/50 transition-all shadow-lg">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-xl">
                                            📅
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg uppercase tracking-wide">
                                                {t.name}
                                            </p>
                                            <p className="text-blue-400 font-mono">
                                                {DIAS[t.weekday]} | {t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)} | {t.duration.substring(0, 5)} h
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarTemplate(t.id)}
                                        className="opacity-0 group-hover:opacity-100 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        🗑️ Borrar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                <p className="text-slate-500">No tenés horarios configurados todavía.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
