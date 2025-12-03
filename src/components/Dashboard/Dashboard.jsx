import React from 'react';
import { Truck, Calendar, Clock, AlertCircle, PlusCircle, History, DollarSign, TrendingUp, Sun, Moon } from 'lucide-react';
import { SectionTitle } from '../Shared/UIComponents';
import { useServices } from '../../context/ServiceContext';

const Dashboard = ({ user, onNavigate }) => {
    const { services } = useServices();

    // KPI Calculations
    const today = new Date().toLocaleDateString();
    const servicesToday = services.filter(s => s.fecha === today).length;
    const pendingServices = services.filter(s => !s.status || s.status === 'Pendiente').length;
    const activeServices = services.filter(s => s.status === 'Asignado' || s.status === 'En Camino').length;

    // --- FINANCIAL LOGIC ---
    const DAILY_GOAL = 50000;
    let currentIncome = 0;
    let shift1 = 0; // 00:00 - 07:59
    let shift2 = 0; // 08:00 - 15:59
    let shift3 = 0; // 16:00 - 23:59

    const todayServicesList = services.filter(s => s.fecha === today);

    todayServicesList.forEach(s => {
        // Calculate Cost (Robust check)
        const cost = parseFloat(s.totalCost || s.quotation?.total || 0);
        if (!isNaN(cost)) {
            currentIncome += cost;

            // Determine Shift
            try {
                const timeString = s.hora || '';
                let hour = 0;

                if (timeString.match(/am|pm/i)) {
                    const parts = timeString.match(/(\d+):(\d+)(?::(\d+))?\s*(am|pm)/i);
                    if (parts) {
                        let h = parseInt(parts[1]);
                        const period = parts[4].toLowerCase();
                        if (period === 'pm' && h < 12) h += 12;
                        if (period === 'am' && h === 12) h = 0;
                        hour = h;
                    }
                } else {
                    // 24h format or simple split
                    const parts = timeString.split(':');
                    if (parts.length > 0) hour = parseInt(parts[0]);
                }

                if (hour >= 0 && hour < 8) shift1 += cost;
                else if (hour >= 8 && hour < 16) shift2 += cost;
                else shift3 += cost;

            } catch (e) {
                console.error("Error parsing shift time", e);
            }
        }
    });

    const goalProgress = Math.min((currentIncome / DAILY_GOAL) * 100, 100);

    const kpis = [
        { title: 'Servicios de Hoy', value: servicesToday.toString(), icon: <Calendar size={24} />, color: 'bg-blue-500' },
        { title: 'Grúas Disponibles', value: '5', icon: <Truck size={24} />, color: 'bg-green-500' }, // Still dummy for now
        { title: 'Servicios Pendientes', value: pendingServices.toString(), icon: <AlertCircle size={24} />, color: 'bg-amber-500' },
    ];

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            {/* WELCOME SECTION */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        Bienvenido de nuevo, <span className="text-blue-600">{user?.nombre || 'Usuario'}</span>
                    </h1>
                    <p className="text-slate-500">Aquí tienes un resumen de la operación de hoy.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-2xl font-bold text-slate-700">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* FINANCIAL DASHBOARD */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-10">
                <SectionTitle title="Indicadores Financieros" icon={<DollarSign size={20} />} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* MAIN GOAL CARD */}
                    <div className="lg:col-span-2 bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-1">Ingresos de Hoy</p>
                                <h3 className="text-4xl font-black text-slate-800">
                                    ${currentIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs font-bold uppercase">Meta Diaria</p>
                                <p className="text-xl font-bold text-slate-600">${DAILY_GOAL.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-6 bg-slate-200 rounded-full overflow-hidden mb-2">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out"
                                style={{ width: `${goalProgress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span>0%</span>
                            <span>{goalProgress.toFixed(1)}% Completado</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* SHIFT BREAKDOWN */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Sun size={18} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Matutino (0-8h)</p>
                                    <p className="font-bold text-slate-700">${shift1.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Sun size={18} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Vespertino (8-16h)</p>
                                    <p className="font-bold text-slate-700">${shift2.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><Moon size={18} /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Nocturno (16-24h)</p>
                                    <p className="font-bold text-slate-700">${shift3.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI CARDS (Original) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {kpis.map((kpi, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-105 cursor-default">
                        <div className={`${kpi.color} text-white p-4 rounded-xl shadow-lg`}>
                            {kpi.icon}
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{kpi.title}</p>
                            <p className="text-3xl font-black text-slate-800">{kpi.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <SectionTitle title="Accesos Rápidos" icon={<Clock size={20} />} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => onNavigate('new-service')}
                        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Truck size={120} />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <PlusCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Nuevo Servicio</h3>
                                <p className="text-blue-100 mt-1">Registrar una nueva solicitud de grúa</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onNavigate('history')}
                        className="group relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <History size={120} />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <History size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Historial de Servicios</h3>
                                <p className="text-slate-300 mt-1">Consultar servicios pasados y reportes</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
