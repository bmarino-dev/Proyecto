'use client'

import { useState, useEffect } from 'react'
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Cargando oferta de turno...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <div className="w-20 h-20 bg-red-900/30 border border-red-500/40 rounded-full flex items-center justify-center text-4xl mb-6">
                    ⚠️
                </div>
                <h1 className="text-3xl font-bold text-red-400 mb-2">Oferta no disponible</h1>
                <p className="text-slate-400 mb-8 text-center max-w-md">{error}</p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all border border-slate-700"
                >
                    Volver al inicio
                </Link>
            </div>
        )
    }

    if (claimSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-white">
                <div className="w-full max-w-lg bg-slate-800 p-8 rounded-3xl border border-green-500/40 shadow-2xl text-center space-y-6 animate-fadeIn">
                    <div className="w-24 h-24 bg-green-600/20 border border-green-500/40 rounded-full mx-auto flex items-center justify-center text-5xl shadow-inner">
                        🎉
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">¡Turno Confirmado!</h2>
                        <p className="text-green-300">
                            Tu reserva con {offerData.business.full_name} se ha agendado exitosamente.
                        </p>
                    </div>

                    <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-700/80 text-left space-y-3 text-sm text-slate-300">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">📅</span>
                            <div>
                                <p className="font-bold text-white">
                                    {new Date(offerData.slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                                </p>
                                <p className="text-slate-400">{offerData.slot.start_datetime.substring(11, 16)} hs</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">👤</span>
                            <div>
                                <p className="font-bold text-white">{offerData.business.full_name}</p>
                                <p className="text-slate-400">{offerData.business.specialty_display}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Link
                            href="/"
                            className="inline-block px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
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
        <div className="flex flex-col items-center p-8 text-white max-w-2xl mx-auto space-y-8">
            
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-white">¡Turno Disponible!</h1>
                <p className="text-purple-300 text-lg">
                    Hola {offerData.first_name}, se liberó un lugar para vos.
                </p>
            </div>

            <div className="w-full bg-slate-800 p-8 rounded-3xl border border-purple-500/30 shadow-xl space-y-8 relative overflow-hidden">
                {/* Banner de expiración */}
                <div className="absolute top-0 left-0 w-full bg-purple-600/20 text-center py-2 text-sm text-purple-200 border-b border-purple-500/20 font-medium">
                    ⏳ Tienes tiempo para aceptar hasta las {timeFormatted} hs
                </div>

                <div className="pt-8 flex flex-col items-center text-center space-y-4">
                    <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-3xl font-bold uppercase shadow-lg shadow-purple-900/30 border-2 border-purple-400/30">
                        {offerData.business.full_name?.[0] || "D"}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{offerData.business.full_name}</h2>
                        <p className="text-purple-400 text-sm uppercase tracking-widest">{offerData.business.specialty_display}</p>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                        📅
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-white text-lg capitalize">
                            {new Date(offerData.slot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                        </p>
                        <p className="text-purple-300 text-xl font-medium">
                            A las {offerData.slot.start_datetime.substring(11, 16)} hs
                        </p>
                    </div>
                </div>

                {claimError && (
                    <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl text-red-400 text-sm text-center">
                        ⚠️ {claimError}
                    </div>
                )}

                <div className="pt-2">
                    <button
                        onClick={handleClaim}
                        disabled={claiming}
                        className="w-full px-8 py-5 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-purple-900/40"
                    >
                        {claiming ? '⏳ Confirmando...' : 'Aceptar y Reclamar Turno 🎯'}
                    </button>
                    
                    <p className="text-center text-slate-500 text-xs mt-4 px-4">
                        Al confirmar, cancelarás automáticamente tus reservas futuras previas con este profesional, si las tuvieras.
                    </p>
                </div>
            </div>
        </div>
    )
}
