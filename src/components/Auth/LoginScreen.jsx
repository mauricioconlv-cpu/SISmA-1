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
                style={{ backgroundImage: "url('/images/login-bg-new.png')" }}
            >
                {/* Deep blue-grey faint whitish gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-slate-200/20 backdrop-blur-[2px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">

                {/* Branding Section - Centered above form */}
                <div className="text-center mb-10 mt-8">
                    <h1 className="text-7xl font-bold text-white tracking-widest leading-none drop-shadow-2xl" style={{ fontFamily: 'Airwave, sans-serif' }}>
                        PROTEO
                    </h1>
                    <h2 className="text-2xl font-normal text-slate-100 tracking-wider mt-3 drop-shadow-md">
                        Ecosistema Operativo inteligente
                    </h2>
                </div>

                {/* Floating Glassmorphism Card */}
                {/* Vidrio esmerilado de baja densidad: bg-white/10, backdrop-blur-md, soft border */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20 relative overflow-hidden">
                    <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                        <InputGroup label={<span className="text-white/80 font-bold uppercase tracking-wider text-xs">Usuario</span>}>
                            <input
                                type="email"
                                className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 focus:border-white/60 focus:ring-0 transition-all outline-none text-white placeholder-white/50 font-medium text-lg"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="nombre@empresa.com"
                                disabled={loading}
                            />
                        </InputGroup>

                        <InputGroup label={<span className="text-white/80 font-bold uppercase tracking-wider text-xs">Contraseña</span>}>
                            <input
                                type="password"
                                className="w-full bg-transparent border border-white/30 rounded-lg px-4 py-3 focus:border-white/60 focus:ring-0 transition-all outline-none text-white placeholder-white/50 font-medium text-lg"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </InputGroup>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#CC5500] hover:bg-[#aa4400] text-white py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 tracking-wide text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Validando credenciales...
                                </>
                            ) : (
                                <span>ACCESO</span>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center text-xs text-white/60 font-medium">
                    &copy; {new Date().getFullYear()} [PROTEO] - Todos los derechos reservados
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
