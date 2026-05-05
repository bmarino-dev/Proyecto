'use client' // ← Le decimos a Next.js que este componente vive en el NAVEGADOR

import { useState } from 'react' // ← useState es la "memoria" del componente

// Este componente recibe la lista de slots como "regalo" desde la página padre
export default function FormularioReserva({ slots, business_id }) {

    // useState es como una caja con memoria.
    // El primer valor es el contenido, el segundo es la función para cambiarlo.
    // null significa "el usuario todavía no eligió ningún turno"
    const [slotSeleccionado, setSlotSeleccionado] = useState(null)

    // Esta caja guarda los datos del formulario (nombre, apellido, email)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
    })

    // Esta caja guarda el estado del envío (null, 'enviando', 'exito', 'error')
    const [estado, setEstado] = useState(null)

    // Esta función se ejecuta cada vez que el usuario escribe en un input
    // "e" es el "evento" (como decir "lo que pasó en el input")
    function handleInput(e) {
        const { name, value } = e.target // Agarramos el nombre y el valor del input
        setFormData({ ...formData, [name]: value }) // Actualizamos solo ese campo
    }

    // Esta función se ejecuta cuando el usuario aprieta "Confirmar Reserva"
    async function handleSubmit(e) {
        e.preventDefault() // Evitamos que la página se recargue sola (comportamiento default del formulario)
        setEstado('enviando')

        try {
            // Acá hacemos el POST a Django. Es como el fetch de antes, pero en sentido inverso.
            const response = await fetch('http://localhost:8001/public/reservations/', {
                method: 'POST', // Le decimos que es un POST (enviar datos), no un GET (pedir datos)
                headers: {
                    'Content-Type': 'application/json' // Le avisamos a Django que le mandamos un JSON
                },
                body: JSON.stringify({ // Convertimos el objeto JS a texto JSON para mandarlo
                    slot_id: slotSeleccionado.id,
                    ...formData // Esto "desempaca" el objeto: first_name, last_name, email
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

    // Si la reserva se hizo bien, mostramos una pantalla de éxito
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

            {/* GRILLA DE BOTONES DE TURNOS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {slots && slots.length > 0 ? (
                    slots.map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => setSlotSeleccionado(slot)} // Al hacer click, guardamos el slot elegido
                            className={`p-4 rounded-xl border transition-all text-center
                                ${slotSeleccionado?.id === slot.id
                                    ? 'bg-blue-600 border-blue-400 text-white' // Seleccionado: azul
                                    : 'bg-slate-800 border-slate-700 hover:bg-blue-600 hover:border-blue-400' // Normal: oscuro
                                }`}
                        >
                            <p className="text-xs text-slate-400">
                                {new Date(slot.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
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

            {/* FORMULARIO - Solo aparece si el usuario eligió un turno */}
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

                    <div className="mb-6">
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
