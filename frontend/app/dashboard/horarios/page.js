'use client'

import { useEffect, useState } from 'react'
import { Icon } from "@/app/components/Visuals";
import Link from 'next/link'
import { apiFetch } from '@/app/lib/api'

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
        try {
            const todosLosHorarios = []
            let url = 'http://localhost:8001/templates/'

            while (url) {
                const res = await apiFetch(url)

                if (!res.ok) {
                    throw new Error(
                        `Error al cargar horarios: ${res.status}`
                    )
                }

                const data = await res.json()
                todosLosHorarios.push(...(data.results ?? data))
                url = data.next ?? null
            }

            setTemplates(todosLosHorarios)

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

            const res = await apiFetch(
                'http://localhost:8001/templates/',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }
            )

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
        try {
            const res = await apiFetch(
                `http://localhost:8001/templates/${id}/`,
                {
                    method: 'DELETE'
                }
            )
            if (res.ok) {
                setTemplates(templates.filter(t => t.id !== id))
            } else {
                const error = await res.json()
                alert(error.detail || "No se pudo eliminar el horario")
            }
        } catch (error) {
            alert("Error al eliminar")
        }
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
                    <h1 className="text-3xl font-semibold">Horarios de atención</h1>
                </div>

                {/* BOTÓN PARA DESPLEGAR */}
                <button
                    onClick={() => setMostrandoForm(!mostrandoForm)}
                    className={` management-toggle w-full mb-6 p-6 rounded-3xl border-2 border-dashed transition-all flex items-center justify-center gap-3 font-semibold text-lg ${mostrandoForm ? 'bg-surface border-brand/20 text-brand' : 'bg-surface border-line text-secondary hover:border-line hover:text-ink'}  `}
                >
                    {mostrandoForm ? '✕ Cancelar Creación' : '+ Agregar Nuevo Horario Semanal'}
                </button>

                {/* FORMULARIO DESPLEGABLE */}
                {mostrandoForm && (
                    <form onSubmit={guardarHorario} className="management-form bg-surface border border-brand/20 rounded-3xl p-8 mb-12 shadow-card duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-full">
                                <label htmlFor="field-setting-1" className="block text-sm font-medium text-secondary mb-2">Nombre del Horario (ej: Lunes Mañana)</label>
                                <input id="field-setting-1"
                                    type="text" required
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
                                    value={nuevoHorario.name}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="field-setting-2" className="block text-sm font-medium text-secondary mb-2">Día de la Semana</label>
                                <select id="field-setting-2"
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
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
                                <label htmlFor="field-setting-3" className="block text-sm font-medium text-secondary mb-2">Duración de cada Turno</label>
                                <select id="field-setting-3"
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
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
                                <label htmlFor="field-setting-4" className="block text-sm font-medium text-secondary mb-2">Hora de Inicio</label>
                                <input id="field-setting-4"
                                    type="time" required
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
                                    value={nuevoHorario.start_time}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, start_time: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="field-setting-5" className="block text-sm font-medium text-secondary mb-2">Hora de Fin</label>
                                <input id="field-setting-5"
                                    type="time" required
                                    className="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-ink focus:border-brand/20 outline-none form-control"
                                    value={nuevoHorario.end_time}
                                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, end_time: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="col-span-full bg-brand hover:bg-brand-dark text-white font-semibold py-4 rounded-2xl shadow-card transition-all mt-4">
                                Confirmar y Guardar Horario
                            </button>
                        </div>
                    </form>
                )}

                {/* LISTA DE HORARIOS */}
                <div className="management-list bg-surface border border-line">
                    <h2 className="text-xl font-semibold mb-8 flex items-center gap-3">
                        <span className="text-brand"><Icon name="list" /></span> Tu semana de atención
                    </h2>
                    <div className="grid gap-4">
                        {templates.length > 0 ? (
                            templates.map((t) => (
                                <div key={t.id} className="management-row border border-line flex justify-between items-center group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center text-xl">
                                            <Icon name="calendar" />
                                        </div>
                                        <div>
                                            <p className="text-ink font-semibold text-lg uppercase tracking-wide">
                                                {t.name}
                                            </p>
                                            <p className="text-brand font-mono">
                                                {DIAS[t.weekday]} | {t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)} | {t.duration.substring(0, 5)} h
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarTemplate(t.id)}
                                        className="delete-button text-danger hover:bg-danger-soft rounded-xl"
                                    >
                                        <Icon name="trash" /> Borrar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state text-center">
                                <p className="text-secondary">No tenés horarios configurados todavía.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
