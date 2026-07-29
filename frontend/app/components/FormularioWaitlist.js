'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function FormularioWaitlist({ business_id }) {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    })
    const [estado, setEstado] = useState(null) // null | 'enviando' | 'exito' | 'error'
    const [mensajeError, setMensajeError] = useState('')

    const handleInput = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setEstado('enviando')
        setMensajeError('')

        try {
            const res = await fetch(`http://localhost:8001/public/business/${business_id}/waitlist/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setEstado('exito')
            } else {
                const data = await res.json()
                setMensajeError(data.detail || 'No se pudo procesar tu solicitud. Por favor intenta nuevamente.')
                setEstado('error')
            }
        } catch (err) {
            console.error('Error al conectarse a la lista de espera:', err)
            setMensajeError('Error de conexión con el servidor. Verifica tu conexión a internet.')
            setEstado('error')
        }
    }

    if (estado === 'exito') {
        return (
            <div className="w-full bg-slate-800 p-8 rounded-3xl border border-purple-500/40 shadow-2xl text-center space-y-6 animate-fadeIn">
                <div className="w-20 h-20 bg-purple-600/20 border border-purple-500/40 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner">
                    🎉
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">¡Te anotaste exitosamente!</h2>
                    <p className="text-purple-300 max-w-md mx-auto">
                        Quedaste registrado en la lista de espera de este profesional.
                    </p>
                </div>

                <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-700/80 max-w-md mx-auto text-left space-y-2 text-sm text-slate-300">
                    <p>📧 <strong className="text-white">Email registrado:</strong> {formData.email}</p>
                    <p>👤 <strong className="text-white">Paciente:</strong> {formData.first_name} {formData.last_name}</p>
                    <p className="text-xs text-slate-400 mt-4 border-t border-slate-800 pt-3">
                        ⚡ Tan pronto como se cancele o libere un turno, el sistema te enviará una notificación automática por correo con un enlace exclusivo para reclamarlo.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/reservar/${business_id}`}
                        className="px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
                    >
                        ← Volver a Ver Disponibilidad
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full bg-slate-800 p-8 rounded-3xl border border-purple-500/30 shadow-xl space-y-6"
        >
            <div className="flex items-center gap-4 p-4 bg-purple-600/10 border border-purple-500/20 rounded-2xl">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    📋
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Inscripción a Lista de Espera</h3>
                    <p className="text-purple-300 text-sm">
                        Ingresá tus datos para ser notificado prioridad apenas se libere una cita.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Nombre <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        name="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleInput}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Juan"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Apellido <span className="text-red-400">*</span></label>
                    <input
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInput}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Pérez"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Email <span className="text-red-400">*</span></label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInput}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="juan@email.com"
                    />
                </div>
                <div>
                    <label className="block text-sm text-slate-400 mb-1">Teléfono <span className="text-slate-500">(opcional)</span></label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInput}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="+598 99 123 456"
                    />
                </div>
            </div>

            {estado === 'error' && (
                <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl text-red-400 text-sm">
                    ⚠️ {mensajeError}
                </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Link
                    href={`/reservar/${business_id}`}
                    className="text-slate-400 hover:text-white text-sm transition-colors order-2 sm:order-1"
                >
                    ← Cancelar y volver al calendario
                </Link>
                <button
                    type="submit"
                    disabled={estado === 'enviando'}
                    className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 order-1 sm:order-2"
                >
                    {estado === 'enviando' ? '⏳ Procesando...' : 'Confirmar Inscripción →'}
                </button>
            </div>
        </form>
    )
}
