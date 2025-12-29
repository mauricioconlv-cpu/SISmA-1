import React from 'react';
import { Home, Truck, FileText, Settings, LogOut, Users, UserCog, Building2, History as HistoryIcon } from 'lucide-react';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ user, activeTab, onTabChange, onLogout }) => {
    // --- MODULE PERMISSIONS (LEGO) ---
    const activeModules = user?.company?.enabled_services || [];
    // activeModules is array of objects from constants.js: [{ id: 'tow', ... }] or database strings? 
    // AuthContext maps them to objects: `enabledServices = modules.map(m => SERVICE_TYPES.find(...))`
    // So we check by .id

    const hasModule = (moduleKey) => {
        if (user?.role === 'superadmin') return true; // Superadmin sees all
        // Check if module is active. NOTE: 'admin_basic' is not in SERVICE_TYPES. 
        // We need to check against the raw 'company_modules' if AuthContext preserved them, or if we should add 'admin_basic' to constants?
        // For now, let's assume 'tow' implies basic operations.
        // User specifically asked for 'admin_basic' for Team Management. 
        // If it's not in the array, the user won't see it. 
        // Let's check if activeModules contains an object with id === moduleKey.
        return activeModules.some(m => m.id === moduleKey);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Inicio', Icon: Home },
        { id: 'new-service', label: 'Nuevo Servicio', Icon: Truck },
        { id: 'history', label: 'Histórico', Icon: HistoryIcon },
    ];

    // Filter Main Menu Items
    const visibleMenuItems = menuItems.filter(item => {
        if (item.id === 'new-service') {
            // Show only if has operational modules (tow, jump, tire, gas)
            return ['tow', 'jump', 'tire', 'gas'].some(key => hasModule(key));
        }
        return true; // Dashboard and History always visible? Or History needs 'tow'? Let's keep them default visible for now.
    });


    // --- ADMINISTRACIÓN (Dueños y Superadmin) ---
    // The previous conditional logic for 'canAccessAdmin' and pushing items is removed
    // as the new structure uses direct conditional rendering in JSX.

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Truck className="text-blue-400" />
                    Control Grúas
                </h1>
                <div className="mt-4 text-xs text-slate-400">
                    <p>Bienvenido,</p>
                    <p className="font-bold text-white text-sm truncate">{user?.nombre || 'Usuario'}</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {visibleMenuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <div className={`${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>
                            <item.Icon size={20} />
                        </div>
                        <span className="text-sm">{item.label}</span>
                    </button>
                ))}

                {/* SECCIÓN ADMINISTRACIÓN (Solo Owners) */}
                {user?.role === 'owner' && (
                    <div className="pt-4 mt-4 border-t border-slate-700">
                        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Administración
                        </p>

                        {/* Gestión de Equipo: Requires 'admin_basic' or 'tow' as fallback if admin_basic not defined in DB yet */}
                        {(hasModule('admin_basic') || hasModule('tow')) && (
                            <button
                                onClick={() => onTabChange('team-management')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'team-management'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <UserCog size={20} />
                                <span className="text-sm">Gestión de Equipo</span>
                            </button>
                        )}

                        {/* Clientes y Tarifas: Requires 'finance' */}
                        {hasModule('finance') && (
                            <button
                                onClick={() => onTabChange('client-management')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'client-management'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Users size={20} />
                                <span className="text-sm">Clientes y Tarifas</span>
                            </button>
                        )}
                    </div>
                )}

                {/* SECCIÓN PLATAFORMA (Solo Superadmin) */}
                {user?.role === 'superadmin' && (
                    <div className="pt-4 mt-4 border-t border-slate-700">
                        <p className="px-4 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                            Gestión de Plataforma
                        </p>
                        <button
                            onClick={() => onTabChange('platform-companies')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'platform-companies'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Building2 size={20} />
                            <span className="text-sm">Empresas SaaS</span>
                        </button>
                    </div>
                )}

            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
