import { Truck, History, Settings, LogOut, Home, Users, Building } from 'lucide-react';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ user, activeTab, onTabChange, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
        { id: 'new-service', label: 'Nuevo Servicio', icon: <Truck size={20} /> },
        { id: 'history', label: 'Histórico', icon: <History size={20} /> },
    ];

    if (user?.rol === ROLES.SUPERADMIN) {
        menuItems.push({ id: 'company-management', label: 'Empresas', icon: <Building size={20} /> });
    }

    if (user?.rol === ROLES.SUPERADMIN || user?.rol === ROLES.ADMIN) {
        menuItems.push({ id: 'client-management', label: 'Clientes', icon: <Users size={20} /> });
    }

    if (user?.rol === ROLES.SUPERADMIN || user?.rol === ROLES.ADMIN) {
        menuItems.push({ id: 'user-management', label: 'Usuarios', icon: <Users size={20} /> });
    }

    if (user?.rol === ROLES.ADMIN || user?.rol === ROLES.SUPERADMIN) {
        menuItems.push({ id: 'admin', label: 'Configuración', icon: <Settings size={20} /> });
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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${activeTab === item.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
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
