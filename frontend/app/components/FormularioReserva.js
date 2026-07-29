'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────
// Helpers de fecha (parseo manual para evitar desfase UTC)
// ─────────────────────────────────────────────────────────
function parseLocalDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function toDateKey(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// ─────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────
export default function FormularioReserva({ business_id }) {

    const hoy = new Date()

    // Estado del calendario
    const [mesVista, setMesVista] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() })
    const [diasDisponibles, setDiasDisponibles] = useState(new Set()) // Set de "YYYY-MM-DD"
    const [cargandoMes, setCargandoMes] = useState(true)

    // Estado del día seleccionado y sus slots
    const [diaSeleccionado, setDiaSeleccionado] = useState(null)    // "YYYY-MM-DD"
    const [slotsDelDia, setSlotsDelDia] = useState([])
    const [cargandoSlots, setCargandoSlots] = useState(false)

    // Estado de la reserva
    const [slotSeleccionado, setSlotSeleccionado] = useState(null)
    const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '' })
    const [estado, setEstado] = useState(null) // null | 'enviando' | 'exito' | 'error'

    // ─────────────────────────────────────────────────────
    // 1. Fetch de TODOS los slots del mes visible
    //    (paginamos hasta agotar resultados) para saber
    //    qué días tienen disponibilidad y marcarlos en el calendario
    // ─────────────────────────────────────────────────────
    const fetchDiasDelMes = useCallback(async () => {
        setCargandoMes(true)
        setDiaSeleccionado(null)
        setSlotsDelDia([])
        setSlotSeleccionado(null)

        const { year, month } = mesVista
        // Primer y último día del mes en formato YYYY-MM-DD
        const primerDia = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const ultimoDia = new Date(year, month + 1, 0)
        const ultimoDiaStr = toDateKey(ultimoDia)

        const diasConSlots = new Set()
        let page = 1
        let hasMore = true

        try {
            while (hasMore) {
                const url = `http://localhost:8001/public/slots/?business_id=${business_id}&page=${page}`
                const res = await fetch(url, { cache: 'no-store' })
                const data = await res.json()

                const results = data.results ?? data
                for (const slot of results) {
                    // Solo incluir slots dentro del mes visible
                    if (slot.date >= primerDia && slot.date <= ultimoDiaStr) {
                        diasConSlots.add(slot.date)
                    }
                }

                // Si la respuesta tiene paginación y hay más páginas, continuar
                if (data.next) {
                    page++
                } else {
                    hasMore = false
                }
            }
        } catch (e) {
            console.error('Error al cargar slots del mes:', e)
        }

        setDiasDisponibles(diasConSlots)
        setCargandoMes(false)
    }, [business_id, mesVista])

    useEffect(() => { fetchDiasDelMes() }, [fetchDiasDelMes])

    // ─────────────────────────────────────────────────────
    // 2. Fetch de slots para el día concreto seleccionado
    // ─────────────────────────────────────────────────────
    async function fetchSlotsDelDia(fecha) {
        setCargandoSlots(true)
        setSlotSeleccionado(null)
        setSlotsDelDia([])

        try {
            const url = `http://localhost:8001/public/slots/?business_id=${business_id}&date=${fecha}`
            const res = await fetch(url, { cache: 'no-store' })
            const data = await res.json()
            setSlotsDelDia(data.results ?? data)
        } catch (e) {
            console.error('Error al cargar slots del día:', e)
        } finally {
            setCargandoSlots(false)
        }
    }

    function handleDiaClick(fechaKey) {
        if (!diasDisponibles.has(fechaKey)) return
        setDiaSeleccionado(fechaKey)
        fetchSlotsDelDia(fechaKey)
    }

    // ─────────────────────────────────────────────────────
    // 3. Navegación de mes
    // ─────────────────────────────────────────────────────
    function mesAnterior() {
        setMesVista(prev => {
            if (prev.month === 0) return { year: prev.year - 1, month: 11 }
            return { ...prev, month: prev.month - 1 }
        })
    }

    function mesSiguiente() {
        setMesVista(prev => {
            if (prev.month === 11) return { year: prev.year + 1, month: 0 }
            return { ...prev, month: prev.month + 1 }
        })
    }

    // No permitir navegar a meses pasados
    const esMesActual = mesVista.year === hoy.getFullYear() && mesVista.month === hoy.getMonth()

    // ─────────────────────────────────────────────────────
    // 4. Construcción de la grilla del calendario
    // ─────────────────────────────────────────────────────
    function buildCalendarGrid() {
        const { year, month } = mesVista
        const primerDelMes = new Date(year, month, 1)
        const ultimoDelMes = new Date(year, month + 1, 0)

        // getDay() → 0=Dom ... 6=Sáb. Necesitamos 0=Lun ... 6=Dom
        const offsetInicio = (primerDelMes.getDay() + 6) % 7

        const dias = []
        // Celdas vacías al inicio
        for (let i = 0; i < offsetInicio; i++) dias.push(null)
        // Días del mes
        for (let d = 1; d <= ultimoDelMes.getDate(); d++) dias.push(d)
        // Celdas vacías al final para completar semana
        while (dias.length % 7 !== 0) dias.push(null)

        return dias
    }

    const grilla = buildCalendarGrid()

    // ─────────────────────────────────────────────────────
    // 5. Formulario de reserva
    // ─────────────────────────────────────────────────────
    function handleInput(e) {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setEstado('enviando')
        try {
            const res = await fetch('http://localhost:8001/public/reservations/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot_id: slotSeleccionado.id, ...formData })
            })
            setEstado(res.ok ? 'exito' : 'error')
        } catch {
            setEstado('error')
        }
    }

    // ─────────────────────────────────────────────────────
    // Pantalla de éxito
    // ─────────────────────────────────────────────────────
    if (estado === 'exito') {
        return (
            <div className="mt-12 w-full bg-green-900/30 border border-green-500 p-12 rounded-3xl text-center">
                <p className="text-5xl mb-4">✅</p>
                <h2 className="text-2xl font-bold text-green-400">¡Turno confirmado!</h2>
                <p className="text-slate-400 mt-2">
                    {parseLocalDate(slotSeleccionado.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {slotSeleccionado.start_datetime.substring(11, 16)} hs
                </p>
                <p className="text-slate-500 mt-3 text-sm">Revisá tu email para ver los detalles y el link de cancelación.</p>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────────────
    return (
        <div className="mt-12 w-full space-y-6">

            {/* ══════════════════════════════════════
                BLOQUE 1: CALENDARIO
            ══════════════════════════════════════ */}
            <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 shadow-xl">

                {/* Cabecera del mes con flechas */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={mesAnterior}
                        disabled={esMesActual}
                        className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 transition-colors"
                        aria-label="Mes anterior"
                    >
                        ←
                    </button>

                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white capitalize">
                            {MESES[mesVista.month]} {mesVista.year}
                        </h2>
                        {cargandoMes && (
                            <p className="text-xs text-blue-400 mt-1 animate-pulse">Cargando disponibilidad…</p>
                        )}
                        {!cargandoMes && (
                            <p className="text-xs text-slate-500 mt-1">
                                {diasDisponibles.size} día{diasDisponibles.size !== 1 ? 's' : ''} con turnos libres
                            </p>
                        )}
                    </div>

                    <button
                        onClick={mesSiguiente}
                        className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 transition-colors"
                        aria-label="Mes siguiente"
                    >
                        →
                    </button>
                </div>

                {/* Encabezados días de la semana */}
                <div className="grid grid-cols-7 mb-2">
                    {DIAS_SEMANA.map(dia => (
                        <div key={dia} className="text-center text-xs font-semibold text-slate-500 py-1 uppercase tracking-wider">
                            {dia}
                        </div>
                    ))}
                </div>

                {/* Grilla de días */}
                <div className="grid grid-cols-7 gap-1">
                    {grilla.map((dia, idx) => {
                        if (dia === null) {
                            return <div key={`empty-${idx}`} />
                        }

                        const fechaKey = `${mesVista.year}-${String(mesVista.month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                        const disponible = diasDisponibles.has(fechaKey)
                        const seleccionado = diaSeleccionado === fechaKey

                        // Fecha del pasado (antes de hoy)
                        const fechaDate = new Date(mesVista.year, mesVista.month, dia)
                        const esPasado = fechaDate < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

                        let clases = 'relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 '

                        if (seleccionado) {
                            clases += 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105 ring-2 ring-blue-400'
                        } else if (disponible && !esPasado) {
                            clases += 'bg-slate-700 text-white hover:bg-blue-500/30 hover:border-blue-500 border border-slate-600 cursor-pointer'
                        } else {
                            clases += 'text-slate-600 cursor-default'
                        }

                        return (
                            <button
                                key={fechaKey}
                                onClick={() => handleDiaClick(fechaKey)}
                                disabled={!disponible || esPasado}
                                className={clases}
                                aria-label={`${dia} de ${MESES[mesVista.month]}`}
                            >
                                <span>{dia}</span>
                                {/* Punto indicador de disponibilidad */}
                                {disponible && !esPasado && !seleccionado && (
                                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-blue-400" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Leyenda */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-700 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                        Con disponibilidad
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                        Día seleccionado
                    </span>
                </div>
            </div>

            {/* ══════════════════════════════════════
                BLOQUE 2: HORARIOS DEL DÍA SELECCIONADO
            ══════════════════════════════════════ */}
            {diaSeleccionado && (
                <div className="bg-slate-800/60 rounded-3xl border border-slate-700 p-6">
                    <h3 className="font-bold text-lg text-white mb-1">
                        {parseLocalDate(diaSeleccionado).toLocaleDateString('es-ES', {
                            weekday: 'long', day: 'numeric', month: 'long'
                        })}
                    </h3>
                    <p className="text-slate-400 text-sm mb-5">Seleccioná el horario que más te convenga</p>

                    {cargandoSlots ? (
                        // Skeleton horarios
                        <div className="flex flex-wrap gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-12 w-24 bg-slate-700 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : slotsDelDia.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {slotsDelDia.map(slot => {
                                const hora = slot.start_datetime.substring(11, 16)
                                const esSeleccionado = slotSeleccionado?.id === slot.id
                                return (
                                    <button
                                        key={slot.id}
                                        onClick={() => setSlotSeleccionado(slot)}
                                        className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border
                                            ${esSeleccionado
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40 scale-105'
                                                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-blue-600/20 hover:border-blue-500'
                                            }`}
                                    >
                                        {hora} hs
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No hay horarios disponibles para este día.</p>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════
                BLOQUE 3: FORMULARIO DE RESERVA
            ══════════════════════════════════════ */}
            {slotSeleccionado && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-slate-800 p-8 rounded-3xl border border-blue-500/30 shadow-xl shadow-blue-900/10"
                >
                    {/* Resumen del turno elegido */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                            📅
                        </div>
                        <div>
                            <p className="font-bold text-white">
                                {parseLocalDate(slotSeleccionado.date).toLocaleDateString('es-ES', {
                                    weekday: 'long', day: 'numeric', month: 'long'
                                })}
                            </p>
                            <p className="text-blue-400 text-sm">
                                {slotSeleccionado.start_datetime.substring(11, 16)} hs
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSlotSeleccionado(null)}
                            className="ml-auto text-slate-500 hover:text-slate-300 text-sm transition-colors"
                        >
                            Cambiar
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">Completá tus datos</h3>
                    <p className="text-slate-400 text-sm mb-6">Te enviaremos la confirmación por email.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nombre <span className="text-red-400">*</span></label>
                            <input type="text" name="first_name" required onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Juan" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Apellido <span className="text-red-400">*</span></label>
                            <input type="text" name="last_name" required onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="Pérez" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Email <span className="text-red-400">*</span></label>
                            <input type="email" name="email" required onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="juan@email.com" />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Teléfono <span className="text-red-400">*</span></label>
                            <input type="tel" name="phone" required onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="+598 12 345 678" />
                        </div>
                    </div>

                    {estado === 'error' && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-400 text-sm">
                            ⚠️ Hubo un error al reservar. Es posible que el turno ya no esté disponible. Intentá de nuevo.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all"
                    >
                        {estado === 'enviando' ? '⏳ Confirmando reserva…' : 'Confirmar Reserva →'}
                    </button>
                </form>
            )}

            {/* ══════════════════════════════════════
                BLOQUE PERMANENTE DE LISTA DE ESPERA
            ══════════════════════════════════════ */}
            <div className="w-full mt-8 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                        ⏳
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-base">¿No encontrás un turno o día conveniente?</h4>
                        <p className="text-slate-400 text-sm">Sumate a la lista de espera y te avisaremos por email cuando se libere un lugar.</p>
                    </div>
                </div>
                <Link
                    href={`/reservar/${business_id}/waitlist`}
                    className="w-full md:w-auto px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-center transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 whitespace-nowrap active:scale-95"
                >
                    Anotarme en Lista de Espera 📋
                </Link>
            </div>
        </div>
    )
}
