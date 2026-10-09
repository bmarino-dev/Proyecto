'use client'

import { useState, useEffect } from 'react'
import { Icon } from "@/app/components/Visuals";
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ClaimWaitlistPage() {
    const params = useParams()
    const waitlist_id = params.id

    const [loading, setLoading] = useState(true)
    const [offerData, setOfferData] = useState(null)
    const [error, setError] = useState(null)
    
    const [claiming, setClaiming] = useState(false)
    const [claimSuccess, setClaimSuccess] = useState(false)
    const [claimError, setClaimError] = useState(null)

    useEffect(() => {
        const fetchOffer = async () => {
            try {
                const res = await fetch(`http://localhost:8001/public/waitlist/${waitlist_id}/claim/`, {
                    cache: 'no-store'
                })
                const data = await res.json()
                
                if (res.ok) {
                    setOfferData(data)
                } else {
                    setError(data.detail || 'La oferta no es válida o ha expirado.')
                }
            } catch (err) {
                console.error('Error fetching waitlist offer:', err)
                setError('Error de conexión. Verifica tu conexión a internet.')
            } finally {
                setLoading(false)
            }
        }
        
        if (waitlist_id) {
            fetchOffer()
        }
    }, [waitlist_id])

    const handleClaim = async () => {
        setClaiming(true)
        setClaimError(null)
        
        try {
            const res = await fetch(`http://localhost:8001/public/waitlist/${waitlist_id}/claim/`, {
                method: 'POST',
            })
            
            if (res.ok) {
                setClaimSuccess(true)
            } else {
                const data = await res.json()
                setClaimError(data.detail || 'Ocurrió un error al confirmar el turno.')
            }
        } catch (err) {
            console.error('Error claiming slot:', err)
            setClaimError('Error de conexión. Intenta nuevamente.')
        } finally {
            setClaiming(false)
        }
    }

    if (loading) {
        return (
            <div className="feedback-screen flex flex-col items-center justify-center text-ink">
                <div className="w-12 h-12 border-4 border-brand/20 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-secondary">Cargando oferta de turno...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="feedback-screen flex flex-col items-center justify-center text-ink">
                <div className="w-20 h-20 bg-danger-soft border border-danger/20 rounded-full flex items-center justify-center text-4xl mb-6">
                    <Icon name="alert" />
                </div>
                <h1 className="text-3xl font-semibold text-danger mb-2">Oferta no disponible</h1>
                <p className="text-secondary mb-8 text-center max-w-md">{error}</p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-surface hover:bg-muted text-ink font-semibold rounded-xl transition-all border border-line"
                >
                    Volver al inicio
                </Link>
            </div>
        )
    }

    if (claimSuccess) {
        return (
            <div className="feedback-screen flex flex-col items-center justify-center text-ink">
                <div className="feedback-card w-full max-w-lg text-center space-y-6">
                    <div className="w-24 h-24 bg-brand-soft border border-brand/20 rounded-full mx-auto flex items-center justify-center text-5xl shadow-card">
                        <Icon name="check" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-semibold text-ink">¡Turno confirmado!</h2>
                        <p className="text-brand">
                            Tu reserva con {offerData.business.full_name} se ha agendado exitosamente.
                        </p>
                    </div>

                    <div className="bg-surface p-6 rounded-2xl border border-line text-left space-y-3 text-sm text-secondary">
                        <div className="flex items-start gap-3">
                            <span className="text-xl"><Icon name="calendar" /></span>
                            <div>
                                <p className="font-semibold text-ink">
                                    {new Date(offerData.slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                                </p>
                                <p className="text-secondary">{offerData.slot.start_datetime.substring(11, 16)} hs</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-xl"><Icon name="person" /></span>
                            <div>
                                <p className="font-semibold text-ink">{offerData.business.full_name}</p>
                                <p className="text-secondary">{offerData.business.specialty_display}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Link
                            href="/"
                            className="inline-block px-8 py-4 bg-muted hover:bg-muted text-ink font-semibold rounded-xl transition-all"
                        >
                            Finalizar
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const expiresAt = new Date(offerData.offer_expires_at)
    const timeFormatted = expiresAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="patient-page claim-page flex flex-col items-center text-ink space-y-8">
            
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-semibold text-ink">Hay un turno para vos</h1>
                <p className="text-brand text-lg">
                    Hola {offerData.first_name}, se liberó un lugar para vos.
                </p>
            </div>

            <div className="claim-card w-full border border-line space-y-8 relative overflow-hidden">
                {/* Banner de expiración */}
                <div className="claim-deadline absolute top-0 left-0 w-full text-center border-b border-line">
                    <Icon name="clock" /> Tenés tiempo para aceptar hasta las {timeFormatted} hs
                </div>

                <div className="pt-8 flex flex-col items-center text-center space-y-4">
                    <div className="professional-avatar rounded-full flex items-center justify-center uppercase">
                        {offerData.business.full_name?.[0] || "D"}
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-ink mb-1">{offerData.business.full_name}</h2>
                        <p className="text-brand text-sm uppercase tracking-widest">{offerData.business.specialty_display}</p>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-line flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-soft rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        <Icon name="calendar" />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-ink text-lg capitalize">
                            {new Date(offerData.slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                        </p>
                        <p className="text-brand text-xl font-medium">
                            A las {offerData.slot.start_datetime.substring(11, 16)} hs
                        </p>
                    </div>
                </div>

                {claimError && (
                    <div className="p-4 bg-danger-soft border border-danger/20 rounded-xl text-danger text-sm text-center">
                        <Icon name="alert" /> {claimError}
                    </div>
                )}

                <div className="pt-2">
                    <button
                        onClick={handleClaim}
                        disabled={claiming}
                        className="w-full px-8 py-5 bg-brand hover:bg-brand-dark disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-xl transition-all shadow-card"
                    >
                        {claiming ? '⏳ Confirmando...' : 'Aceptar y Reclamar Turno 🎯'}
                    </button>
                    
                    <p className="text-center text-secondary text-xs mt-4 px-4">
                        Al confirmar, cancelarás automáticamente tus reservas futuras previas con este profesional, si las tuvieras.
                    </p>
                </div>
            </div>
        </div>
    )
}
