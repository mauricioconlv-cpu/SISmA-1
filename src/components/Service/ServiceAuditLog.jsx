import React, { useState } from 'react';
import { Edit3, Save, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

const ServiceAuditLog = ({ logs, onAddLog, user }) => {
    // --- LIVE LOGGING STATE ---
    const [liveLog, setLiveLog] = useState({
        isRecording: false,
        startTime: null,
        text: ''
    });

    const handleStartRecording = () => {
        setLiveLog({
            isRecording: true,
            startTime: Date.now(),
            text: ''
        });
    };

    const handleStopRecording = () => {
        if (!liveLog.text.trim()) {
            setLiveLog({ isRecording: false, startTime: null, text: '' });
            return;
        }

        const durationMs = Date.now() - liveLog.startTime;
        const totalSeconds = Math.floor(durationMs / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const durationStr = `${mins}m ${secs}s`;

        const logEntry = {
            timestamp: Date.now(),
            user: user?.nombre || 'Sistema',
            action: 'NOTA_BITACORA',
            details: `Nota agregada (Tiempo en redacción: ${durationStr}): ${liveLog.text}`
        };

        onAddLog(logEntry);
        setLiveLog({ isRecording: false, startTime: null, text: '' });
    };

    // Helper to parse/normalize logs
    const parseLog = (log) => {
        if (!log) return null;
        let entry = log;

        if (typeof log === 'string') {
            if (log.trim().startsWith('{') || log.trim().startsWith('[')) {
                try {
                    entry = JSON.parse(log);
                } catch (e) {
                    entry = { action: log, user: 'Sistema', timestamp: Date.now() };
                }
            } else {
                entry = { action: log, user: 'Sistema', timestamp: Date.now() };
            }
        }

        // Normalize
        const user = entry.user || entry.usuario || 'Sistema';
        const timestamp = entry.timestamp || entry.fecha;
        const action = entry.action || entry.accion || 'Registro';
        const details = entry.details || entry.detalles;

        return { user, timestamp, action, details };
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        if (typeof ts === 'number') return new Date(ts).toLocaleString();
        return ts;
    };

    const getBorderColor = (action) => {
        const lower = action.toLowerCase();
        if (lower.includes('estatus') || lower.includes('arribo') || lower.includes('contacto')) return 'border-blue-500';
        if (lower.includes('modificación') || lower.includes('cambio')) return 'border-orange-500';
        if (lower.includes('nota') || lower.includes('comentario')) return 'border-gray-500';
        if (lower.includes('error') || lower.includes('alerta')) return 'border-red-500';
        return 'border-slate-400';
    };

    const renderLogDetails = (details) => {
        if (!details) return null;
        if (typeof details === 'string') return <p className="text-slate-600">{details}</p>;

        if (Array.isArray(details)) {
            if (details.length === 0) return null;
            return (
                <ul className="space-y-1 mt-2">
                    {details.map((change, idx) => (
                        <li key={idx} className="text-xs flex items-center gap-2 bg-slate-50 p-1 rounded">
                            <span className="font-bold text-slate-700 w-1/3 truncate" title={change.campo}>{change.campo}:</span>
                            <span className="text-red-500 line-through truncate max-w-[30%]">{change.anterior}</span>
                            <span className="text-slate-400">→</span>
                            <span className="text-green-600 font-bold truncate max-w-[30%]">{change.nuevo}</span>
                        </li>
                    ))}
                </ul>
            );
        }

        return <p className="text-slate-600">{JSON.stringify(details)}</p>;
    };

    return (
        <div className="mt-8 mb-4">
            {/* LIVE LOGGING COMPONENT */}
            <div className="mb-8">
                {!liveLog.isRecording ? (
                    <button
                        onClick={handleStartRecording}
                        className="w-full py-3 bg-white border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Edit3 size={20} />
                        <span>Añadir Nota a Bitácora</span>
                    </button>
                ) : (
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-100 animate-fade-in">
                        <div className="mb-3">
                            <textarea
                                value={liveLog.text}
                                onChange={(e) => setLiveLog(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Escriba su nota o comentario aquí..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 placeholder-slate-400 focus:border-blue-500 outline-none h-24 resize-none"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setLiveLog({ isRecording: false, startTime: null, text: '' })}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleStopRecording}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm"
                            >
                                <Save size={16} />
                                Guardar Nota
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CLEAN AUDIT LOG LIST */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider text-sm">
                        <Clock size={18} className="text-slate-400" /> Historial de Actividad
                    </h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-full">
                        {logs ? logs.length : 0} Eventos
                    </span>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {logs && logs.length > 0 ? (
                        [...logs].reverse().map((log, index) => {
                            try {
                                let logData = log;

                                // CASO 1: Es un string que parece JSON -> Lo convertimos a Objeto
                                if (typeof log === 'string' && log.trim().startsWith('{')) {
                                    try {
                                        logData = JSON.parse(log);
                                    } catch (e) {
                                        // Si falla el parseo, se queda como string simple
                                    }
                                }

                                // RENDERIZADO
                                let content;

                                // A) Si logData es ahora un OBJETO (con user, action, timestamp)
                                if (typeof logData === 'object' && logData !== null) {

                                    // Lógica de visualización inteligente
                                    let displayText = logData.action;

                                    // Si es una nota, mostrar el mensaje real
                                    if (logData.action === 'NOTA_BITACORA' || logData.action === 'REGISTRO_OPERATIVO' || logData.action === 'NOTA_MANUAL') {
                                        displayText = logData.details || logData.message || logData.action;
                                    }

                                    // Si tiene duración, agregarla
                                    if (logData.duration) {
                                        displayText = `(⏱️ ${logData.duration}) ${displayText}`;
                                    }

                                    content = (
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-800 text-xs">
                                                    {logData.user || 'Sistema'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {logData.timestamp ? new Date(logData.timestamp).toLocaleString() : ''}
                                                </span>
                                            </div>

                                            {/* Si es un cambio de estatus o algo complejo, usar renderLogDetails, si no, texto plano */}
                                            {logData.action === 'NOTA_BITACORA' || logData.action === 'NOTA_MANUAL' ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{displayText}</p>
                                            ) : (
                                                <>
                                                    <p className="font-semibold text-gray-700 text-xs mb-1">{displayText}</p>
                                                    {logData.details && typeof logData.details !== 'string' && (
                                                        <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">
                                                            {renderLogDetails(logData.details)}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                }
                                // B) Si logData sigue siendo TEXTO SIMPLE
                                else {
                                    content = <span className="text-gray-600">{String(logData)}</span>;
                                }

                                return (
                                    <div key={index} className={`bg-white p-3 mb-2 rounded border-l-4 shadow-sm text-sm ${getBorderColor(logData.action || '')}`}>
                                        {content}
                                    </div>
                                );

                            } catch (err) {
                                // Fallback final por si algo muy raro pasa
                                return null;
                            }
                        })
                    ) : (
                        <p className="text-gray-400 italic text-sm text-center">Sin registros aún.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceAuditLog;
