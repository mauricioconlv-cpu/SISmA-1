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

                {/* Floating White Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 relative overflow-hidden">
                    <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                        <InputGroup label={<span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Correo Electrónico</span>}>
                            <input
                                type="email"
                                className="w-full bg-transparent border-b-2 border-slate-200 px-0 py-3 focus:border-blue-600 transition-all outline-none text-slate-900 placeholder-slate-400 font-medium text-lg"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="nombre@empresa.com"
                                disabled={loading}
                            />
                        </InputGroup>

                        <InputGroup label={<span className="text-slate-600 font-bold uppercase tracking-wider text-xs">Contraseña</span>}>
                            <input
                                type="password"
                                className="w-full bg-transparent border-b-2 border-slate-200 px-0 py-3 focus:border-blue-600 transition-all outline-none text-slate-900 placeholder-slate-400 font-medium text-lg"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </InputGroup>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed group transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Validando credenciales...
                                </>
                            ) : (
                                <span className="tracking-wide text-lg">INICIAR SESIÓN</span>
                            )}
                        </button>
                    </form>

                    {/* Decorative element for the card */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                </div>

                <div className="mt-12 text-center text-xs text-slate-400 font-medium">
                    &copy; {new Date().getFullYear()} [PROTEO] - Todos los derechos reservados
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
