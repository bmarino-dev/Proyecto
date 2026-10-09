'use client'

import Link from "next/link";
import { AuthAside } from "@/app/components/Visuals";
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
        <div className="auth-layout signup-layout">
            <AuthAside />
            <div className="auth-card">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-semibold text-ink mb-2">Creá tu cuenta</h1>
                    <p className="text-secondary">Organizá tu consultorio con ReservaFácil</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Username */}
                    <div className="md:col-span-2">
                        <label htmlFor="field-username" className="block text-sm font-medium text-secondary mb-2">Usuario</label>
                        <input id="field-username"
                            type="text"
                            name="username"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all placeholder:text-secondary form-control"
                            placeholder="nombre_usuario"
                        />
                    </div>

                    {/* Nombre */}
                    <div>
                        <label htmlFor="field-first_name" className="block text-sm font-medium text-secondary mb-2">Nombre</label>
                        <input id="field-first_name"
                            type="text"
                            name="first_name"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all placeholder:text-secondary form-control"
                            placeholder="Tu nombre"
                        />
                    </div>

                    {/* Apellido */}
                    <div>
                        <label htmlFor="field-last_name" className="block text-sm font-medium text-secondary mb-2">Apellido</label>
                        <input id="field-last_name"
                            type="text"
                            name="last_name"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all placeholder:text-secondary form-control"
                            placeholder="Tu apellido"
                        />
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                        <label htmlFor="field-email" className="block text-sm font-medium text-secondary mb-2">Email</label>
                        <input id="field-email"
                            type="email"
                            name="email"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all placeholder:text-secondary form-control"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    {/* Password */}
                    <div className="md:col-span-2">
                        <label htmlFor="field-password" className="block text-sm font-medium text-secondary mb-2">Contraseña</label>
                        <input id="field-password"
                            type="password"
                            name="password"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all placeholder:text-secondary form-control"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Especialidad (Selección) */}
                    <div>
                        <label htmlFor="field-specialty" className="block text-sm font-medium text-secondary mb-2">Especialidad</label>
                        <select id="field-specialty"
                            name="specialty"
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all appearance-none cursor-pointer form-control"
                        >
                            <option value="psychology">Psicología</option>
                            <option value="nutrition">Nutrición</option>
                            <option value="physiotherapy">Kinesiología</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    {/* Número (Teléfono) */}
                    <div>
                        <label htmlFor="field-phone" className="block text-sm font-medium text-secondary mb-2">Teléfono</label>
                        <input id="field-phone"
                            type="text"
                            name="phone"
                            required
                            onChange={handleInput}
                            className="w-full bg-canvas border border-line rounded-2xl px-5 py-3.5 text-ink focus:outline-none focus:border-brand/20 transition-all placeholder:text-secondary form-control"
                            placeholder="+598 98 11 ..."
                        />
                    </div>

                    {/* Mensajes de Estado */}
                    <div className="md:col-span-2 mt-4">
                        {estado === 'error' && (
                            <div className="bg-danger-soft border border-danger/20 p-4 rounded-2xl">
                                <p className="text-danger text-sm text-center font-medium">Error al registrar. Verificá que el usuario o email no existan.</p>
                            </div>
                        )}
                        {estado === 'exito' && (
                            <div className="bg-brand-soft border border-brand/20 p-4 rounded-2xl">
                                <p className="text-brand text-sm text-center font-medium">¡Cuenta creada con éxito! Redirigiendo al login...</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={estado === 'enviando'}
                        className="md:col-span-2 w-full bg-brand hover:bg-brand-dark disabled:bg-brand/50 text-white font-semibold py-4 rounded-2xl transition-all shadow-card flex items-center justify-center gap-3"
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
                    <Link href="/login" className="text-secondary hover:text-brand transition-all text-sm group">
                        ¿Ya tenés una cuenta? <span className="font-semibold text-secondary group-hover:text-brand">Iniciá sesión</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}