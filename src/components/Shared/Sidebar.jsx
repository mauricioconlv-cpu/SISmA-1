import React from 'react';
import { Home, Truck, FileText, Settings, LogOut, Users, UserCog, Building2, History as HistoryIcon, Package, DollarSign } from 'lucide-react';
import { ROLES } from '../../utils/constants';

// Data-Driven Menu Configuration (The Map)
// Data-Driven Menu Configuration (The Map)
const MODULE_MENU_MAP = {
    // Core (Tow enables multiple features)
    'tow': [
        { id: 'new-service', label: 'Nuevo Servicio', Icon: Truck },
        { id: 'team-management', label: 'Gestión de Equipo', Icon: UserCog }, // Formerly admin_basic
        { id: 'cabin', label: 'Cabina', Icon: Building2 } // New request
    ],

    // Modules
    'finance': [], // Finanzas (Now empty, Clients moved to Core)
    'inventory': [
        { id: 'inventory', label: 'Inventario', Icon: Package }
    ]
};

const Sidebar = ({ user, activeTab, onTabChange, onLogout }) => {
    // --- MODULE PERMISSIONS (LEGO) ---
    const rawModules = user?.company?.modules || (user?.company?.enabled_services || []).map(m => m.id);
    const activeModuleKeys = new Set(rawModules);

    const isOwner = user?.role === 'owner' || user?.rol === 'owner';
    const isSuperAdmin = user?.role === 'superadmin' || user?.rol === 'superadmin';
    const isAdmin = user?.role === 'admin' || user?.rol === 'admin';

    // --- BUILD DYNAMIC MENU ---
    const menuItems = [];

    // 1. Dashboard (Always Visible)
    menuItems.push({ id: 'dashboard', label: 'Inicio', Icon: Home });

    // 2. Core Management (Visible for Owners/Admins/SuperAdmins) - NO MODULE REQUIRED
    if (isOwner || isAdmin || isSuperAdmin) {
        menuItems.push({ id: 'client-management', label: 'Clientes y Tarifas', Icon: DollarSign });
    }

    // 3. Dynamic Modules (LEGO) - Owners see active modules, SuperAdmins see EVERYTHING for Demos
    if (isOwner || isSuperAdmin) {
        // We iterate through the defined MAP to preserve order
        Object.keys(MODULE_MENU_MAP).forEach(key => {
            // Check if user has this module active OR if they are SuperAdmin (Demo Mode)
            if (isSuperAdmin || activeModuleKeys.has(key)) {
                const items = MODULE_MENU_MAP[key];
                if (Array.isArray(items)) {
                    // Filter out empty arrays if any
                    if (items.length > 0) menuItems.push(...items);
                } else {
                    menuItems.push(items);
                }
            }
        });

        // History - Always visible
        menuItems.push({ id: 'history', label: 'Histórico', Icon: HistoryIcon });
    }

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Truck className="text-blue-400" />
                    [PROTEO]
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
