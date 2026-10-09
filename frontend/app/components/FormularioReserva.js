'use client'

import { useState, useEffect, useCallback } from 'react'
import { Icon } from "@/app/components/Visuals";
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
            const todosLosSlots = []

            let url = `http://localhost:8001/public/slots/?business_id=${business_id}&date=${fecha}`

            while (url) {
                const res = await fetch(url, { cache: 'no-store' })

                if (!res.ok) {
                    throw new Error(`Error al cargar turnos: ${res.status}`)
                }

                const data = await res.json()

                todosLosSlots.push(...(data.results ?? data))
                url = data.next ?? null
            }

            setSlotsDelDia(todosLosSlots)
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
            <div className="feedback-card mt-6 w-full text-center">
                <p className="text-5xl mb-4"><Icon name="check" /></p>
                <h2 className="text-2xl font-semibold text-brand">¡Turno confirmado!</h2>
                <p className="text-secondary mt-2">
                    {parseLocalDate(slotSeleccionado.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {slotSeleccionado.start_datetime.substring(11, 16)} hs
                </p>
                <p className="text-secondary mt-3 text-sm">Revisá tu email para ver los detalles y el link de cancelación.</p>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────────────
    return (
        <div className="reservation-flow w-full space-y-6">

            {/* ══════════════════════════════════════
                BLOQUE 1: CALENDARIO
            ══════════════════════════════════════ */}
            <div className="calendar-panel border border-line">

                {/* Cabecera del mes con flechas */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={mesAnterior}
                        disabled={esMesActual}
                        className="w-10 h-10 rounded-xl bg-muted hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-secondary transition-colors"
                        aria-label="Mes anterior"
                    >
                        ←
                    </button>

                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-ink capitalize">
                            {MESES[mesVista.month]} {mesVista.year}
                        </h2>
                        {cargandoMes && (
                            <p className="text-xs text-brand mt-1 animate-pulse">Cargando disponibilidad…</p>
                        )}
                        {!cargandoMes && (
                            <p className="text-xs text-secondary mt-1">
                                {diasDisponibles.size} día{diasDisponibles.size !== 1 ? 's' : ''} con turnos libres
                            </p>
                        )}
                    </div>

                    <button
                        onClick={mesSiguiente}
                        className="w-10 h-10 rounded-xl bg-muted hover:bg-muted flex items-center justify-center text-secondary transition-colors"
                        aria-label="Mes siguiente"
                    >
                        →
                    </button>
                </div>

                {/* Encabezados días de la semana */}
                <div className="grid grid-cols-7 mb-2">
                    {DIAS_SEMANA.map(dia => (
                        <div key={dia} className="text-center text-xs font-semibold text-secondary py-1 uppercase tracking-wider">
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

                        let clases = 'calendar-day relative flex flex-col items-center justify-center font-medium '

                        if (seleccionado) {
                            clases += 'calendar-day-selected'
                        } else if (disponible && !esPasado) {
                            clases += 'calendar-day-available'
                        } else {
                            clases += 'calendar-day-unavailable'
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
                                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Leyenda */}
                <div className="calendar-legend flex items-center gap-4 mt-5 pt-4 border-t border-line text-xs text-secondary">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand/50 inline-block" />
                        Con disponibilidad
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block" />
                        Día seleccionado
                    </span>
                </div>
            </div>

            {/* ══════════════════════════════════════
                BLOQUE 2: HORARIOS DEL DÍA SELECCIONADO
            ══════════════════════════════════════ */}
            {diaSeleccionado && (
                <div className="slots-panel border border-line">
                    <h3 className="font-semibold text-lg text-ink mb-1">
                        {parseLocalDate(diaSeleccionado).toLocaleDateString('es-ES', {
                            weekday: 'long', day: 'numeric', month: 'long'
                        })}
                    </h3>
                    <p className="text-secondary text-sm mb-5">Seleccioná el horario que más te convenga</p>

                    {cargandoSlots ? (
                        // Skeleton horarios
                        <div className="flex flex-wrap gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-12 w-24 bg-muted rounded-xl animate-pulse" />
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
                                        className={` slot-button px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border ${esSeleccionado
                                                ? 'bg-brand border-brand/20 text-white shadow-card'
                                                : 'bg-muted border-line text-secondary hover:bg-brand-soft hover:border-brand/20'
                                            }  `}
                                    >
                                        {hora} hs
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-secondary text-sm">No hay horarios disponibles para este día.</p>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════
                BLOQUE 3: FORMULARIO DE RESERVA
            ══════════════════════════════════════ */}
            {slotSeleccionado && (
                <form
                    onSubmit={handleSubmit}
                    className="booking-form border border-line"
                >
                    {/* Resumen del turno elegido */}
                    <div className="booking-summary flex items-center gap-4 mb-6 p-4 border border-brand/20 rounded-2xl">
                        <div className="icon-tile">
                            <Icon name="calendar" />
                        </div>
                        <div>
                            <p className="font-semibold text-ink">
                                {parseLocalDate(slotSeleccionado.date).toLocaleDateString('es-ES', {
                                    weekday: 'long', day: 'numeric', month: 'long'
                                })}
                            </p>
                            <p className="text-brand text-sm">
                                {slotSeleccionado.start_datetime.substring(11, 16)} hs
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSlotSeleccionado(null)}
                            className="ml-auto text-secondary hover:text-secondary text-sm transition-colors"
                        >
                            Cambiar
                        </button>
                    </div>

                    <h3 className="text-lg font-semibold text-ink mb-1">Completá tus datos</h3>
                    <p className="text-secondary text-sm mb-6">Te enviaremos la confirmación por email.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="field-first_name" className="block text-sm text-secondary mb-1">Nombre <span className="text-danger">*</span></label>
                            <input id="field-first_name" type="text" name="first_name" required onChange={handleInput}
                                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                                placeholder="Juan" />
                        </div>
                        <div>
                            <label htmlFor="field-last_name" className="block text-sm text-secondary mb-1">Apellido <span className="text-danger">*</span></label>
                            <input id="field-last_name" type="text" name="last_name" required onChange={handleInput}
                                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                                placeholder="Pérez" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="field-email" className="block text-sm text-secondary mb-1">Email <span className="text-danger">*</span></label>
                            <input id="field-email" type="email" name="email" required onChange={handleInput}
                                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                                placeholder="juan@email.com" />
                        </div>
                        <div>
                            <label htmlFor="field-phone" className="block text-sm text-secondary mb-1">Teléfono <span className="text-danger">*</span></label>
                            <input id="field-phone" type="tel" name="phone" required onChange={handleInput}
                                className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                                placeholder="+598 12 345 678" />
                        </div>
                    </div>

                    {estado === 'error' && (
                        <div className="mb-4 p-3 bg-danger-soft border border-danger/20 rounded-xl text-danger text-sm">
                            <Icon name="alert" /> Hubo un error al reservar. Es posible que el turno ya no esté disponible. Intentá de nuevo.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="w-full bg-brand hover:bg-brand-dark disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all"
                    >
                        {estado === 'enviando' ? '⏳ Confirmando reserva…' : 'Confirmar Reserva →'}
                    </button>
                </form>
            )}

            {/* ══════════════════════════════════════
                BLOQUE PERMANENTE DE LISTA DE ESPERA
            ══════════════════════════════════════ */}
            <div className="waitlist-callout w-full mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-left">
                    <div className="icon-tile">
                        <Icon name="clock" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-ink text-base">¿No encontrás un turno o día conveniente?</h4>
                        <p className="text-secondary text-sm">Sumate a la lista de espera y te avisaremos por email cuando se libere un lugar.</p>
                    </div>
                </div>
                <Link
                    href={`/reservar/${business_id}/waitlist`}
                    className="w-full md:w-auto px-6 py-3.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl text-center transition-all shadow-card whitespace-nowrap"
                >
                    Anotarme en Lista de Espera <Icon name="list" />
                </Link>
            </div>
        </div>
    )
}
