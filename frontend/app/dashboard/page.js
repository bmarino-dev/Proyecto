'use client'

import { useEffect, useState } from 'react'


export default function Dashboard() {

    const [reservas, setReservas] = useState([])

    useEffect(() => {
        const token = localStorage.getItem('token')

        // Creamos la función que pide los datos
        async function traerReservas() {
            // 1. Si no hay token, no hacemos nada
            if (!token) return;
            // 2. Hacemos el fetch
            const response = await fetch('http://localhost:8001/reservations/', {
                method: 'GET', // (Opcional, GET es por defecto)
                headers: {
                    'Authorization': `Bearer ${token}` // autorizamos via token
                }
            });
            // 3. Revisamos si salió bien
            if (response.ok) {
                const data = await response.json();
                setReservas(data.results); // Guardamos la data en nuestra memoria
                console.log("Reservas que llegaron:", data);
            }
        }
        // 4. Ejecutamos la función que acabamos de crear
        traerReservas();
    }, [])
    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
                        <p className="text-slate-400 mt-1">Acá podés gestionar todos tus turnos</p>
                    </div>
                </header>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">📅</span>
                        Próximos Turnos
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reservas && reservas.length > 0 ? (
                            reservas.map((reserva) => (
                                <div key={reserva.id} className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl transition-all shadow-lg hover:shadow-blue-900/20">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl text-white font-bold">
                                            {reserva.patient.first_name.charAt(0)}
                                        </div>
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium uppercase tracking-wider">
                                            {reserva.status}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {reserva.patient.first_name} {reserva.patient.last_name}
                                    </h3>

                                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2">
                                        <span className="text-slate-500">🕒</span>
                                        <p className="text-blue-400 font-mono font-medium">
                                            {reserva.slot.date} • {reserva.slot.start_datetime.substring(11, 16)} hs
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                                <p className="text-slate-400 text-lg">No hay turnos pendientes por el momento.</p>
                                <p className="text-slate-500 text-sm mt-2">¡Aprovechá para descansar!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
