import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { InputGroup } from '../Shared/UIComponents';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);

    const handleLoginAttempt = () => {
        if (!otp) return alert("Ingrese la clave OTP");
        const result = login(email, otp);
        if (!result.success) {
            alert(result.message || "Error al iniciar sesión");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
                {/* CINTA DE MODO PRUEBAS */}
                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-8 py-1 transform rotate-45 translate-x-8 translate-y-4 shadow">
                    MODO DEV
                </div>

                <div className="text-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-full inline-block text-white mb-2">
                        <Truck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Acceso Seguro</h2>
                </div>

                {/* ACORDEÓN DE CLAVES PARA TI */}
                <div className="mb-6 bg-slate-100 p-3 rounded border border-slate-300 text-xs text-slate-600">
                    <p className="font-bold mb-1 border-b border-slate-300 pb-1">🔑 Credenciales de Prueba:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <span className="block font-bold text-purple-600">Admin:</span>
                            <span className="font-mono bg-white px-1 rounded border cursor-pointer select-all" onClick={() => setEmail('admin@gruas.com')}>admin@gruas.com</span>
                        </div>
                        <div>
                            <span className="block font-bold text-blue-600">Operador:</span>
                            <span className="font-mono bg-white px-1 rounded border cursor-pointer select-all" onClick={() => setEmail('operaciones@gruas.com')}>operaciones@gruas.com</span>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="font-bold text-red-500">Clave OTP: </span>
                        <span className="font-mono font-bold bg-yellow-200 px-2 rounded border border-yellow-400">1234</span>
                    </div>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <InputGroup label="Usuario / Correo">
                            <input type="email" className="w-full border p-3 rounded" value={email} onChange={e => setEmail(e.target.value)} placeholder="Selecciona uno de arriba 👆" />
                        </InputGroup>
                        <button onClick={() => { if (email) setStep(2); else alert("Ingrese correo"); }} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">Validar Usuario</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-2">Usuario: <strong>{email}</strong></div>
                        <InputGroup label="Clave OTP">
                            <input type="text" className="w-full border p-3 rounded text-center text-2xl tracking-widest" value={otp} onChange={e => setOtp(e.target.value)} placeholder="1234" />
                        </InputGroup>
                        <div className="flex gap-2">
                            <button onClick={() => setStep(1)} className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded font-bold hover:bg-gray-300">Atrás</button>
                            <button onClick={handleLoginAttempt} className="w-2/3 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Ingresar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
