import React, { useState } from 'react';
import Sidebar from './components/Shared/Sidebar';
import ServiceWizard from './components/Service/ServiceWizard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { ClientProvider } from './context/ClientContext';
// Force Deploy Fix
import LoginScreen from './components/Auth/LoginScreen';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Admin/UserManagement';

import CompanyManagement from './components/Admin/CompanyManagement';
import ClientManagement from './components/Admin/ClientManagement';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminPanel from './components/Admin/AdminPanel';
import { DEFAULT_CLIENTES, DEFAULT_GRUAS, DEFAULT_OPERADORES, DEFAULT_USUARIOS, DEFAULT_TARIFAS } from './utils/constants';

import { ServiceProvider } from './context/ServiceContext';
import History from './components/Admin/History';

const AppContent = () => {
    const { user, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedServiceId, setSelectedServiceId] = useState(null);

    // Admin Config State
    const [config, setConfig] = useState({
        clientes: DEFAULT_CLIENTES,
        gruas: DEFAULT_GRUAS,
        operadores: DEFAULT_OPERADORES,
        usuarios: DEFAULT_USUARIOS,
        tarifas: DEFAULT_TARIFAS
    });

    if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100">Cargando...</div>;
    if (!user) return <LoginScreen />;

    const handleEditService = (serviceId) => {
        setSelectedServiceId(serviceId);
        setActiveTab('new-service');
    };

    const handleNavigate = (tab) => {
        if (tab === 'new-service') setSelectedServiceId(null); // Reset if creating new
        setActiveTab(tab);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard onNavigate={handleNavigate} />;
            case 'new-service':
                return <ServiceWizard user={user} config={config} serviceId={selectedServiceId} />;
            case 'history':
                return <History onEdit={handleEditService} />;
            case 'admin':
                return <AdminPanel config={config} onSave={setConfig} />;
            case 'admin-dashboard': // New Route
                return <AdminDashboard />;
            case 'user-management':
                return <UserManagement />;
            case 'company-management':
                return <CompanyManagement />;
            case 'client-management':
                return <ClientManagement />;
            default:
                return <Dashboard onNavigate={setActiveTab} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar
                user={user}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={logout}
            />
            <main className="flex-1 ml-64 overflow-y-auto p-8">
                {renderContent()}
            </main>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <CompanyProvider>
                <ClientProvider>
                    <ServiceProvider>
                        <AppContent />
                    </ServiceProvider>
                </ClientProvider>
            </CompanyProvider>
        </AuthProvider>
    );
};

export default App;
