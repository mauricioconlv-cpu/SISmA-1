import React, { useState, useEffect } from 'react';
import { MapPin, User, Truck, CheckCircle, Shield, ArrowLeft } from 'lucide-react';

const SERVICE_STATUS = {
    ASIGNADO: 'Asignado',
    EN_SITIO: 'En Sitio',
    CONTACTO: 'Contacto',
    TRASLADO: 'Traslado',
    FINALIZADO: 'Finalizado'
};

const Step3Monitoring = ({
    formData,
    setFormData,
    onBack,
    onAddLog,
    onCloseService,
    user
}) => {
    const [remainingMinutes, setRemainingMinutes] = useState(null);

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (!formData.etaTimestamp) return;

        const updateTimer = () => {
            const isArrived = formData.status !== SERVICE_STATUS.ASIGNADO && formData.status !== 'En Camino';
            let targetTime = Date.now();

            if (isArrived && formData.arrivalTimestamp) {
                targetTime = formData.arrivalTimestamp;
            }

            const diff = formData.etaTimestamp - targetTime;
            const mins = Math.ceil(diff / 60000);
            setRemainingMinutes(mins);
        };

        updateTimer();

        // Only interval if NOT arrived
        const isArrived = formData.status !== SERVICE_STATUS.ASIGNADO && formData.status !== 'En Camino';
        if (!isArrived) {
            const interval = setInterval(updateTimer, 30000);
            return () => clearInterval(interval);
        }
    }, [formData.etaTimestamp, formData.status, formData.arrivalTimestamp]);

    const getTrafficLightStatus = (mins) => {
        if (mins === null) return 'Calculando...';

        const isArrived = formData.status !== SERVICE_STATUS.ASIGNADO && formData.status !== 'En Camino';
        if (isArrived) {
            return mins >= 0 ? 'LLEGÓ A TIEMPO' : 'LLEGÓ CON RETRASO';
        }

        if (mins > 15) return 'A Tiempo';
        if (mins > 0) return 'Por Vencer';
        return 'Retrasado';
    };

    const handleStatusAdvance = () => {
        const now = new Date();
        let nextStatus = '';
        let updates = {};
        let logMessage = '';

        switch (formData.status) {
            case SERVICE_STATUS.ASIGNADO:
            case 'En Camino':
                nextStatus = SERVICE_STATUS.EN_SITIO;
                updates = {
                    arrivalTimestamp: now.getTime(),
                    horaArriboReal: now.toLocaleString()
                };
                logMessage = `Arribo de unidad registrado a las ${now.toLocaleTimeString()}`;
                break;
            case SERVICE_STATUS.EN_SITIO:
                nextStatus = SERVICE_STATUS.CONTACTO;
                updates = {
                    contactTimestamp: now.getTime()
                };
                logMessage = `Contacto con usuario/cabina registrado a las ${now.toLocaleTimeString()}`;
                break;
            case SERVICE_STATUS.CONTACTO:
                nextStatus = SERVICE_STATUS.TRASLADO;
                updates = {
                    transferTimestamp: now.getTime()
                };
                logMessage = `Inicio de traslado registrado a las ${now.toLocaleTimeString()}`;
                break;
            case SERVICE_STATUS.TRASLADO:
                nextStatus = SERVICE_STATUS.FINALIZADO;
                updates = {
                    completionTimestamp: now.getTime()
                };
                logMessage = `Servicio finalizado a las ${now.toLocaleTimeString()}`;
                break;
            default:
                return;
        }

        // 1. Add Log via Prop
        if (onAddLog) {
            onAddLog({
                action: 'CAMBIO_ESTATUS',
                details: `⏱️ CAMBIO DE ESTATUS: ${formData.status} -> ${nextStatus}. ${logMessage}. Registrado por: ${user?.nombre || 'Sistema'}`
            });
        }

        // 2. Update Parent Data
        const finalData = {
            ...formData,
            status: nextStatus,
            ...updates
        };

        setFormData(finalData);

        if (nextStatus === SERVICE_STATUS.EN_SITIO) {
            alert("📍 Arribo registrado correctamente. El reloj se ha detenido.");
        }
    };

    const handleArchiveService = () => {
        if (!confirm("¿Está seguro de cerrar y archivar este expediente? No podrá realizar más cambios operativos.")) return;

        // 1. Add Log via Prop
        if (onAddLog) {
            onAddLog('Expediente cerrado y archivado administrativamente');
        }

        // 2. Call Parent Close Handler
        if (onCloseService) {
            onCloseService();
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold">
                    <ArrowLeft size={18} /> Volver a Asignación
                </button>
                <h2 className="text-2xl font-bold text-slate-800">Monitoreo de Arribo</h2>
            </div>

            {/* HEADER INFO */}
            <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="text-center border-r border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Hora de Asignación</p>
                    <p className="text-xl font-bold text-slate-800">
                        {formData.assignmentTimestamp ? new Date(formData.assignmentTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">ETA (Estimada)</p>
                    <p className="text-xl font-bold text-blue-600">
                        {formData.etaTimestamp ? new Date(formData.etaTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </p>
                </div>

                <div className="mb-4 opacity-80 mt-4 text-center col-span-2">
                    {remainingMinutes !== null && remainingMinutes < 0 ? (
                        <span className="text-6xl">⚠️</span>
                    ) : (
                        <span className="text-6xl">⏱️</span>
                    )}
                </div>
                <h3 className="text-5xl font-black mb-2 tracking-tight text-center col-span-2">
                    {(() => {
                        const isArrived = formData.status !== SERVICE_STATUS.ASIGNADO && formData.status !== 'En Camino';
                        if (isArrived) {
                            return getTrafficLightStatus(remainingMinutes);
                        }
                        return remainingMinutes !== null ? (
                            remainingMinutes > 0 ? `${remainingMinutes} min` : (
                                remainingMinutes === 0 ? "AHORA" : `${Math.abs(remainingMinutes)} min TARDE`
                            )
                        ) : '--';
                    })()}
                </h3>
                <p className="text-xl font-bold uppercase tracking-widest opacity-75 text-center col-span-2">
                    {getTrafficLightStatus(remainingMinutes)}
                </p>
            </div>

            {/* ACTIONS & TIMELINE */}
            <div className="flex flex-col items-center pt-6 space-y-8">

                {/* DYNAMIC ACTION BUTTON */}
                {formData.status !== SERVICE_STATUS.FINALIZADO && formData.status !== 'Cerrado' ? (
                    <button
                        onClick={handleStatusAdvance}
                        className={`px-12 py-6 rounded-2xl font-bold text-xl shadow-xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95 text-white
                ${formData.status === SERVICE_STATUS.ASIGNADO || formData.status === 'En Camino' ? 'bg-blue-600 hover:bg-blue-700' :
                                formData.status === SERVICE_STATUS.EN_SITIO ? 'bg-indigo-600 hover:bg-indigo-700' :
                                    formData.status === SERVICE_STATUS.CONTACTO ? 'bg-purple-600 hover:bg-purple-700' :
                                        'bg-green-600 hover:bg-green-700' // TRASLADO -> FINALIZAR
                            }`}
                    >
                        {formData.status === SERVICE_STATUS.ASIGNADO || formData.status === 'En Camino' ? <><MapPin size={32} /> Registrar Arribo</> :
                            formData.status === SERVICE_STATUS.EN_SITIO ? <><User size={32} /> Registrar Contacto</> :
                                formData.status === SERVICE_STATUS.CONTACTO ? <><Truck size={32} /> Iniciar Traslado</> :
                                    <><CheckCircle size={32} /> Finalizar Servicio</>}
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-green-100 text-green-800 px-8 py-4 rounded-xl font-bold flex items-center gap-3 border border-green-200 text-xl">
                            <CheckCircle size={32} /> Servicio Completado
                        </div>
                        {formData.status === SERVICE_STATUS.FINALIZADO && (
                            <button
                                onClick={handleArchiveService}
                                className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                            >
                                <Shield size={20} /> 🗂️ Cerrar y Archivar Expediente
                            </button>
                        )}
                    </div>
                )}

                {/* TIMELINE */}
                <div className="w-full max-w-3xl bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">Progreso del Servicio</h4>
                    <div className="space-y-4">
                        {/* ASIGNACIÓN */}
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckCircle size={16} /></div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-700">Asignación de Unidad</p>
                                <p className="text-xs text-slate-500">{new Date(formData.assignmentTimestamp).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* ARRIBO */}
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${formData.arrivalTimestamp ? 'bg-green-500' : 'bg-slate-300'}`}>
                                {formData.arrivalTimestamp ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold ${formData.arrivalTimestamp ? 'text-slate-700' : 'text-slate-400'}`}>Arribo al Sitio</p>
                                {formData.arrivalTimestamp && <p className="text-xs text-slate-500">{new Date(formData.arrivalTimestamp).toLocaleString()}</p>}
                            </div>
                        </div>

                        {/* CONTACTO */}
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${formData.contactTimestamp ? 'bg-green-500' : 'bg-slate-300'}`}>
                                {formData.contactTimestamp ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold ${formData.contactTimestamp ? 'text-slate-700' : 'text-slate-400'}`}>Contacto con Usuario</p>
                                {formData.contactTimestamp && <p className="text-xs text-slate-500">{new Date(formData.contactTimestamp).toLocaleString()}</p>}
                            </div>
                        </div>

                        {/* TRASLADO */}
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${formData.transferTimestamp ? 'bg-green-500' : 'bg-slate-300'}`}>
                                {formData.transferTimestamp ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold ${formData.transferTimestamp ? 'text-slate-700' : 'text-slate-400'}`}>Inicio de Traslado</p>
                                {formData.transferTimestamp && <p className="text-xs text-slate-500">{new Date(formData.transferTimestamp).toLocaleString()}</p>}
                            </div>
                        </div>

                        {/* FINALIZADO */}
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${formData.completionTimestamp ? 'bg-green-500' : 'bg-slate-300'}`}>
                                {formData.completionTimestamp ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold ${formData.completionTimestamp ? 'text-slate-700' : 'text-slate-400'}`}>Servicio Finalizado</p>
                                {formData.completionTimestamp && <p className="text-xs text-slate-500">{new Date(formData.completionTimestamp).toLocaleString()}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step3Monitoring;
