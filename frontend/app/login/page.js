'use client'

import Link from "next/link";
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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">Bienvenido</h1>
                    <p className="text-slate-400">Ingresá a tu panel de profesional</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Usuario</label>
                        <input
                            type="text"
                            name="username"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                            placeholder="tu_usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {estado === 'error' && (
                        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-2xl">
                            <p className="text-red-400 text-sm text-center">Usuario o contraseña incorrectos.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20"
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
                        className="text-slate-400 hover:text-blue-400 transition-all text-sm"
                    >
                        ¿No tienes una cuenta? <span className="font-bold">Registrate</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}