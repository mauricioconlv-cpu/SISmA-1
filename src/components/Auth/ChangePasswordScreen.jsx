import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const ChangePasswordScreen = ({ onChangePassword }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = () => {
        if (newPassword.length < 4) return alert("La contraseña debe tener al menos 4 caracteres.");
        if (newPassword !== confirmPassword) return alert("Las contraseñas no coinciden.");

        onChangePassword(newPassword);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="bg-yellow-500 p-3 rounded-full inline-block text-white mb-2">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Cambio de Contraseña</h2>
                    <p className="text-gray-600 text-sm mt-2">Por seguridad, debes cambiar tu contraseña temporal.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                        <input
                            type="password"
                            className="w-full border p-3 rounded"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Confirmar Contraseña</label>
                        <input
                            type="password"
                            className="w-full border p-3 rounded"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 mt-4"
                    >
                        Actualizar y Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordScreen;
