import React, { useState } from 'react';
import { Truck, Loader2 } from 'lucide-react';
import { InputGroup } from '../Shared/UIComponents';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return alert("Por favor completa todos los campos");

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            alert(result.message || "Error al iniciar sesión. Verifica tus credenciales.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
                <div className="text-center mb-8">
                    <div className="bg-blue-600 p-4 rounded-full inline-block text-white mb-4 shadow-lg">
                        <Truck size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Acceso Seguro</h2>
                    <p className="text-gray-500 mt-2">Sistema de Despacho de Grúas</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <InputGroup label="Correo Electrónico">
                        <input
                            type="email"
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            disabled={loading}
                        />
                    </InputGroup>

                    <InputGroup label="Contraseña">
                        <input
                            type="password"
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </InputGroup>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:bg-blue-400"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Validando...
                            </>
                        ) : (
                            "Ingresar al Sistema"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} Plataforma Integral de Asistencia
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
