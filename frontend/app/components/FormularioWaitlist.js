'use client'

import { useState } from 'react'
import { Icon } from "@/app/components/Visuals";
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
            <div className="feedback-card w-full text-center space-y-6">
                <div className="w-20 h-20 bg-brand-soft border border-brand/20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-card">
                    <Icon name="check" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-ink">¡Te anotaste exitosamente!</h2>
                    <p className="text-brand max-w-md mx-auto">
                        Quedaste registrado en la lista de espera de este profesional.
                    </p>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-line max-w-md mx-auto text-left space-y-2 text-sm text-secondary">
                    <p><Icon name="mail" /> <strong className="text-ink">Email registrado:</strong> {formData.email}</p>
                    <p><Icon name="person" /> <strong className="text-ink">Paciente:</strong> {formData.first_name} {formData.last_name}</p>
                    <p className="text-xs text-secondary mt-4 border-t border-line pt-3">
                        <Icon name="check" /> Tan pronto como se cancele o libere un turno, el sistema te enviará una notificación automática por correo con un enlace exclusivo para reclamarlo.
                    </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href={`/reservar/${business_id}`}
                        className="px-6 py-3.5 bg-muted hover:bg-muted text-ink font-semibold rounded-xl transition-all"
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
            className="waitlist-form w-full border border-line space-y-6"
        >
            <div className="flex items-center gap-4 p-4 bg-brand-soft border border-brand/20 rounded-2xl">
                <div className="icon-tile bg-surface">
                    <Icon name="list" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-ink">Inscripción a Lista de Espera</h3>
                    <p className="text-brand text-sm">
                        Dejanos tus datos. Te avisaremos por email cuando se libere un turno.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="field-first_name" className="block text-sm text-secondary mb-1">Nombre <span className="text-danger">*</span></label>
                    <input id="field-first_name"
                        type="text"
                        name="first_name"
                        required
                        value={formData.first_name}
                        onChange={handleInput}
                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                        placeholder="Juan"
                    />
                </div>
                <div>
                    <label htmlFor="field-last_name" className="block text-sm text-secondary mb-1">Apellido <span className="text-danger">*</span></label>
                    <input id="field-last_name"
                        type="text"
                        name="last_name"
                        required
                        value={formData.last_name}
                        onChange={handleInput}
                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                        placeholder="Pérez"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="field-email" className="block text-sm text-secondary mb-1">Email <span className="text-danger">*</span></label>
                    <input id="field-email"
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInput}
                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                        placeholder="juan@email.com"
                    />
                </div>
                <div>
                    <label htmlFor="field-phone" className="block text-sm text-secondary mb-1">Teléfono <span className="text-secondary">(opcional)</span></label>
                    <input id="field-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInput}
                        className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-brand/20 transition-colors form-control"
                        placeholder="+598 99 123 456"
                    />
                </div>
            </div>

            {estado === 'error' && (
                <div className="p-4 bg-danger-soft border border-danger/20 rounded-xl text-danger text-sm">
                    <Icon name="alert" /> {mensajeError}
                </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <Link
                    href={`/reservar/${business_id}`}
                    className="text-secondary hover:text-ink text-sm transition-colors order-2 sm:order-1"
                >
                    ← Cancelar y volver al calendario
                </Link>
                <button
                    type="submit"
                    disabled={estado === 'enviando'}
                    className="w-full sm:w-auto px-8 py-4 bg-brand hover:bg-brand-dark disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-card order-1 sm:order-2"
                >
                    {estado === 'enviando' ? '⏳ Procesando...' : 'Confirmar Inscripción →'}
                </button>
            </div>
        </form>
    )
}
