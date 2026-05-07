'use client'

import { useState } from 'react'

// Componente interactivo que maneja la selección de turnos y el envío de la reserva.
// Recibe los slots y el business_id como props desde page.js (Server Component).
export default function FormularioReserva({ slots, business_id }) {

    // Estado de la UI: turno seleccionado, datos del formulario y fase del envío.
    // 'estado' puede ser: null | 'enviando' | 'exito' | 'error'
    const [slotSeleccionado, setSlotSeleccionado] = useState(null)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    })
    const [estado, setEstado] = useState(null)

    // Controlled input: sincroniza cada campo del formulario con el estado.
    function handleInput(e) {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    // Envía la reserva al backend. El slot_id y los datos del paciente van en el body.
    async function handleSubmit(e) {
        e.preventDefault()
        setEstado('enviando')

        try {
            const response = await fetch('http://localhost:8001/public/reservations/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    slot_id: slotSeleccionado.id,
                    ...formData
                })
            })

            if (response.ok) {
                setEstado('exito')
            } else {
                setEstado('error')
            }
        } catch (error) {
            setEstado('error')
        }
    }

    if (estado === 'exito') {
        return (
            <div className="mt-12 w-full bg-green-900/30 border border-green-500 p-12 rounded-3xl text-center">
                <p className="text-4xl mb-4">✅</p>
                <h2 className="text-2xl font-bold text-green-400">¡Turno confirmado!</h2>
                <p className="text-slate-400 mt-2">Revisá tu email para ver los detalles.</p>
            </div>
        )
    }

    return (
        <div className="mt-12 w-full">
            <h2 className="text-2xl font-bold mb-6 text-center">Próximos Turnos Disponibles</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {slots && slots.length > 0 ? (
                    slots.map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => setSlotSeleccionado(slot)}
                            className={`p-4 rounded-xl border transition-all text-center
                                ${slotSeleccionado?.id === slot.id
                                    ? 'bg-blue-600 border-blue-400 text-white'
                                    : 'bg-slate-800 border-slate-700 hover:bg-blue-600 hover:border-blue-400'
                                }`}
                        >
                            <p className="text-xs text-slate-400">
                                {(() => {
                                    const [y, m, d] = slot.date.split('-');
                                    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                                })()}
                            </p>
                            <p className="font-bold">
                                {slot.start_datetime.substring(11, 16)} hs
                            </p>
                        </button>
                    ))
                ) : (
                    <p className="col-span-full text-center text-slate-500 bg-slate-800/30 p-12 rounded-3xl border border-dashed border-slate-700">
                        No hay turnos disponibles por el momento.
                    </p>
                )}
            </div>

            {/* El formulario aparece solo cuando el usuario seleccionó un turno */}
            {slotSeleccionado && (
                <form onSubmit={handleSubmit} className="mt-8 bg-slate-800 p-8 rounded-3xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-6">
                        Reservando el {new Date(slotSeleccionado.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {slotSeleccionado.start_datetime.substring(11, 16)} hs
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nombre</label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Juan"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Apellido</label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Pérez"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="juan@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                onChange={handleInput}
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                                placeholder="+598 12 345 678"
                            />
                        </div>
                    </div>

                    {estado === 'error' && (
                        <p className="text-red-400 mb-4 text-sm">Hubo un error al reservar. Intentá de nuevo.</p>
                    )}

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all"
                    >
                        {estado === 'enviando' ? 'Enviando...' : 'Confirmar Reserva'}
                    </button>
                </form>
            )}
        </div>
    )
}
