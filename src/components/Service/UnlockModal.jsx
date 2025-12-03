import React, { useState } from 'react';
import { Lock, AlertTriangle, X } from 'lucide-react';
import { MOTIVOS_CAMBIO } from '../../utils/constants';
import { StyledSelect, StyledTextArea } from '../Shared/UIComponents';

const UnlockModal = ({ onConfirm, onCancel }) => {
    const [motivo, setMotivo] = useState('');
    const [otroMotivo, setOtroMotivo] = useState('');

    const handleConfirm = () => {
        if (!motivo) return;
        const finalMotivo = motivo === 'request' ? 'Lo solicita Cabina/Cliente' :
            motivo === 'wrong_info' ? 'Cabina/Cliente proporciona mal la información' :
                motivo === 'user_change' ? 'Usuario/Asegurado cambia ubicación' : motivo;

        onConfirm(finalMotivo);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm transition-all">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>

                <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-amber-100 p-4 rounded-full mb-4 text-amber-600">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Autorización Requerida</h3>
                    <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                        Este registro está bloqueado. Para modificarlo, es necesario justificar la razón. Esta acción quedará registrada.
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Motivo del cambio</label>
                        <StyledSelect
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                        >
                            <option value="">-- Seleccione un motivo --</option>
                            <option value="user_change">Usuario/Asegurado cambia ubicación</option>
                            <option value="wrong_info">Cabina/Cliente proporciona mal la información</option>
                            <option value="request">Lo solicita Cabina/Cliente</option>
                        </StyledSelect>
                    </div>

                    {motivo === 'Otro' && (
                        <StyledTextArea
                            placeholder="Especifique el motivo detalladamente..."
                            value={otroMotivo}
                            onChange={e => setOtroMotivo(e.target.value)}
                            className="h-24"
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={onCancel} className="px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!motivo || (motivo === 'Otro' && !otroMotivo)}
                        className={`px-4 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${!motivo || (motivo === 'Otro' && !otroMotivo)
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-xl'
                            }`}
                    >
                        <Lock size={18} /> Desbloquear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnlockModal;
