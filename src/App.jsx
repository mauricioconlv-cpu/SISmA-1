import React, { useState } from 'react';
import Sidebar from './components/Shared/Sidebar';
import ServiceWizard from './components/Service/ServiceWizard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { ClientProvider } from './context/ClientContext';
import LoginScreen from './components/Auth/LoginScreen';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Admin/UserManagement';

import CompanyManagement from './components/Admin/CompanyManagement';
import ClientManagement from './components/Admin/ClientManagement';
import AdminDashboard from './components/Admin/AdminDashboard'; // Import at top

// ... existing imports ...

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
