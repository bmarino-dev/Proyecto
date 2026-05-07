'use client'

import Link from "next/link";
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Signup() {
    // Estado inicial con todos los campos necesarios para el backend
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        email: '',
        specialty: 'psychology', // Valor por defecto del backend
        phone: ''
    })

    const [estado, setEstado] = useState(null)
    const router = useRouter()

    function handleInput(e) {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setEstado('enviando')

        try {
            const response = await fetch('http://localhost:8001/auth/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setEstado('exito')
                // Tras el registro, redirigimos al login para que entre con sus nuevas credenciales
                setTimeout(() => router.push('/login'), 2000)
            } else {
                const errorData = await response.json()
                setEstado('error')
                console.error("Error en registro:", errorData)
            }
        } catch (error) {
            setEstado('error')
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-12">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">Crea tu cuenta</h1>
                    <p className="text-slate-400">Únete a ReservaFácil como profesional</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Username */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Usuario</label>
                        <input
                            type="text"
                            name="username"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="nombre_usuario"
                        />
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Nombre</label>
                        <input
                            type="text"
                            name="first_name"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="Tu nombre"
                        />
                    </div>

                    {/* Apellido */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Apellido</label>
                        <input
                            type="text"
                            name="last_name"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="Tu apellido"
                        />
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Especialidad (Selección) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Especialidad</label>
                        <select
                            name="specialty"
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="psychology">Psicología</option>
                            <option value="nutrition">Nutrición</option>
                            <option value="physiotherapy">Kinesiología</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    {/* Número (Teléfono) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Teléfono</label>
                        <input
                            type="text"
                            name="phone"
                            required
                            onChange={handleInput}
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="+598 98 11 ..."
                        />
                    </div>

                    {/* Mensajes de Estado */}
                    <div className="md:col-span-2 mt-4">
                        {estado === 'error' && (
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-2xl">
                                <p className="text-red-400 text-sm text-center font-medium">Error al registrar. Verifica que el usuario o email no existan.</p>
                            </div>
                        )}
                        {estado === 'exito' && (
                            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-2xl">
                                <p className="text-green-400 text-sm text-center font-medium">¡Cuenta creada con éxito! Redirigiendo al login...</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="md:col-span-2 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                        {estado === 'enviando' ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Creando cuenta...
                            </>
                        ) : 'Registrarse ahora'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-slate-400 hover:text-blue-400 transition-all text-sm group">
                        ¿Ya tienes una cuenta? <span className="font-bold text-slate-300 group-hover:text-blue-400">Inicia sesión</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}