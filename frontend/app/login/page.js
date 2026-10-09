'use client'

import Link from "next/link";
import { AuthAside } from "@/app/components/Visuals";
import { useState } from 'react'
import { useRouter } from 'next/navigation'


export default function Login({ params }) {
    //Memoria
    const [formData, setFormData] = useState({
        username: '',
        password: '',

    })
    const [estado, setEstado] = useState(null)

    //router para redirigir la pagina
    const router = useRouter()

    function handleInput(e) {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setEstado('Enviando')

        try {
            const response = await fetch('http://localhost:8001/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData
                })

            })

            if (response.ok) {
                setEstado('exito')
                //guardamos la data del push inluyendo el jwt
                const data = await response.json()
                //Guardamos el token en la memoria local
                localStorage.setItem('token', data.access)
                localStorage.setItem('refresh', data.refresh)
                //redirigimos al dashboard
                router.push('/dashboard')
            }
            else {
                setEstado('error')
            }


        } catch (error) {
            setEstado('error')
        }


    }

    return (
        <div className="auth-layout login-layout">
            <AuthAside />
            <div className="auth-card">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-semibold text-ink mb-2">Bienvenido</h1>
                    <p className="text-secondary">Ingresá a tu panel de profesional</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="field-username" className="block text-sm font-medium text-secondary mb-2">Usuario</label>
                        <input id="field-username"
                            type="text"
                            name="username"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-4 text-ink focus:outline-none focus:border-brand/20 transition-all form-control"
                            placeholder="tu_usuario"
                        />
                    </div>

                    <div>
                        <label htmlFor="field-password" className="block text-sm font-medium text-secondary mb-2">Contraseña</label>
                        <input id="field-password"
                            type="password"
                            name="password"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-4 text-ink focus:outline-none focus:border-brand/20 transition-all form-control"
                            placeholder="••••••••"
                        />
                    </div>

                    {estado === 'error' && (
                        <div className="bg-danger-soft border border-danger/20 p-4 rounded-2xl">
                            <p className="text-danger text-sm text-center">Usuario o contraseña incorrectos.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="w-full bg-brand hover:bg-brand-dark disabled:bg-brand/50 text-white font-semibold py-4 rounded-2xl transition-all shadow-card"
                    >
                        {estado === 'enviando' ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Entrando...
                            </span>
                        ) : 'Iniciar Sesión'}
                    </button>
                </form>
                <div className="mt-8 text-center">
                    <Link
                        href="/signup"
                        className="text-secondary hover:text-brand transition-all text-sm"
                    >
                        ¿No tenés una cuenta? <span className="font-semibold">Registrate</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}