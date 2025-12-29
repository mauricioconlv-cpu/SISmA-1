import React from 'react';
import { Home, Truck, FileText, Settings, LogOut, Users, UserCog, Building2, History as HistoryIcon, Package, DollarSign } from 'lucide-react';
import { ROLES } from '../../utils/constants';

// Data-Driven Menu Configuration (The Map)
const MODULE_MENU_MAP = {
    // Core
    'tow': { id: 'new-service', label: 'Nuevo Servicio', Icon: Truck },

    // Admin / Management
    'admin_basic': { id: 'team-management', label: 'Gestión de Equipo', Icon: UserCog },
    'finance': { id: 'client-management', label: 'Clientes y Tarifas', Icon: DollarSign },
    'inventory': { id: 'inventory', label: 'Inventario', Icon: Package },
};

const Sidebar = ({ user, activeTab, onTabChange, onLogout }) => {
    // --- MODULE PERMISSIONS (LEGO) ---
    // Get array of active module objects [{id: 'tow'}, ...] or string keys?
    // AuthContext structure: 
    // user.company.modules = ['tow', 'finance', 'inventory'] (Raw keys)
    // user.company.enabled_services = [{id: 'tow', ...}] (Hydrated services only)

    // We prefer specific 'modules' array, fallback to enabled_services for legacy safety
    const rawModules = user?.company?.modules || (user?.company?.enabled_services || []).map(m => m.id);
    const activeModuleKeys = new Set(rawModules);

    // Helper: Superadmin sees everything, or specific things? 
    // User said: "Si user.role === 'superadmin': ... Muestra un menú nuevo ... OCULTA el menú de 'Administración' normal"
    // But later said "IMPORTANTE: Si el usuario es superadmin, ignora esto y muéstrale todo (o su panel de gestión)."
    // I will stick to: Superadmin gets Platform Panel. Owner gets LEGO menu.

    const isOwner = user?.role === 'owner';
    const isSuperAdmin = user?.role === 'superadmin';

    // --- BUILD DYNAMIC MENU ---
    const menuItems = [];

    // 1. Dashboard (Always Visible)
    menuItems.push({ id: 'dashboard', label: 'Inicio', Icon: Home });

    // 2. Dynamic Modules (LEGO) - Only for Owners (or users with company context)
    if (isOwner) {
        // We iterate through the defined MAP to preserve order
        Object.keys(MODULE_MENU_MAP).forEach(key => {
            // Check if user has this module active
            // Special case: 'tow' key controls 'new-service' but user might have 'jump', 'tire' etc without 'tow'?
            // User said: "El botón 'Nuevo Servicio' SOLO debe aparecer si modules.includes('tow')"
            // I will strictly check keys.

            // For 'admin_basic', if it's not in DB yet, I might fallback allowing it if 'tow' is present?
            // User said: "El botón 'Gestión de Equipo' SOLO si modules.includes('admin_basic')."
            // I will strictly follow that. If they don't have it, they don't see it.

            if (activeModuleKeys.has(key)) {
                menuItems.push(MODULE_MENU_MAP[key]);
            }
        });

        // History - Always visible or linked to 'tow'? 
        // Let's keep History always visible for Owners for now
        menuItems.push({ id: 'history', label: 'Histórico', Icon: HistoryIcon });
    }

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
                {menuItems.map(item => (
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

                {/* SECCIÓN PLATAFORMA (Solo Superadmin) */}
                {isSuperAdmin && (
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
