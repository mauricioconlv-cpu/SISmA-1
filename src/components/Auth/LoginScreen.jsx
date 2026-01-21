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
        <div className="min-h-screen flex items-center justify-center p-4 relative font-['Space_Grotesk'] overflow-hidden">
            {/* Background Image & Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed"
                style={{ backgroundImage: "url('/images/proteo 2.png')" }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-900/10"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">

                {/* Branding Section - Centered above form */}
                {/* Branding Section - Centered above form */}
                <div className="text-center mb-10 mt-8">
                    <h1 className="text-7xl font-bold text-white tracking-widest leading-none drop-shadow-2xl font-['Space_Grotesk']">
                        PROTEO
                    </h1>
                    <h2 className="text-2xl font-normal text-slate-200 tracking-wider mt-3 drop-shadow-md">
                        Ecosistema Operativo inteligente
                    </h2>
                </div>

                {/* Glassmorphic Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <InputGroup label={<span className="text-blue-100">Correo Electrónico</span>}>
                            <input
                                type="email"
                                className="w-full bg-slate-900/50 border border-slate-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all outline-none text-white placeholder-slate-400"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="nombre@empresa.com"
                                disabled={loading}
                            />
                        </InputGroup>

                        <InputGroup label={<span className="text-blue-100">Contraseña</span>}>
                            <input
                                type="password"
                                className="w-full bg-slate-900/50 border border-slate-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all outline-none text-white placeholder-slate-400"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </InputGroup>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 disabled:bg-blue-800/50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Validando credenciales...
                                </>
                            ) : (
                                <span className="tracking-wide">INICIAR SESIÓN</span>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-xs text-blue-200/60 font-light">
                    &copy; {new Date().getFullYear()} [PROTEO] - Todos los derechos reservados
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
