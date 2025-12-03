import React from 'react';
import { Clock, AlertCircle, Edit, Shield } from 'lucide-react';

const WizardAudit = ({ logs }) => {
    // Helper to normalize log data (handles mixed English/Spanish and JSON strings)
    const normalizeLog = (log) => {
        if (!log) return null;

        // Handle JSON strings
        if (typeof log === 'string') {
            if (log.trim().startsWith('{')) {
                try {
                    return normalizeLog(JSON.parse(log));
                } catch (e) {
                    return { action: log, user: 'Sistema', timestamp: Date.now() };
                }
            }
            return { action: log, user: 'Sistema', timestamp: Date.now() };
        }

        // Normalize keys
        return {
            user: log.user || log.usuario || 'Sistema',
            timestamp: log.timestamp || log.fecha, // timestamp (number) or fecha (string)
            action: log.action || log.accion || 'Registro',
            details: log.details || log.detalles // string or array
        };
    };

    const getBorderColor = (action) => {
        const lower = action.toLowerCase();
        if (lower.includes('cambio de estatus') || lower.includes('arribo') || lower.includes('contacto') || lower.includes('traslado')) return 'border-blue-500';
        if (lower.includes('modificación') || lower.includes('desbloqueo') || lower.includes('edición')) return 'border-orange-500';
        return 'border-slate-300';
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        if (typeof ts === 'number') return new Date(ts).toLocaleString();
        return ts; // Assume it's already a formatted string
    };

    return (
        <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Clock size={16} /> Bitácora de Cambios
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {!logs || logs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-2">No hay registros aún.</p>
                ) : (
                    logs.map((rawLog, index) => {
                        const log = normalizeLog(rawLog);
                        if (!log) return null;

                        const borderColor = getBorderColor(log.action);
                        const isChangeList = Array.isArray(log.details);

                        return (
                            <div key={index} className={`bg-white p-3 rounded shadow-sm border-l-4 ${borderColor} transition-all hover:shadow-md`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-slate-700">{log.user}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{formatTimestamp(log.timestamp)}</span>
                                </div>

                                <div className="text-sm font-medium text-slate-800 mb-1">
                                    {log.action}
                                </div>

                                {/* Render Details */}
                                {log.details && (
                                    <div className="text-xs text-slate-600 mt-1">
                                        {isChangeList ? (
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-1">
                                                {log.details.map((d, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <span className="font-semibold text-slate-700">{d.campo || d.field}:</span>
                                                        <span className="text-red-400 line-through decoration-red-400/50">{d.anterior || d.oldVal || '(vacío)'}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className="text-green-600 font-bold">{d.nuevo || d.newVal || '(vacío)'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p>{log.details}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WizardAudit;
