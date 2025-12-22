import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Save, Plus, Shield, CheckSquare, Square } from 'lucide-react';

const AdminDashboard = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newClient, setNewClient] = useState({ name: '', contact_email: '', client_code: '' });

    // Available Modules
    const AVAILABLE_MODULES = [
        { id: 'towing', label: 'Gestión de Grúas' },
        { id: 'inventory', label: 'Inventario / Corralón' },
        { id: 'billing', label: 'Facturación' },
        { id: 'users', label: 'Gestión de Usuarios' }
    ];

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('Supabase Error (fetchClients):', error);
            // Treat error as empty list to avoid UI blocking
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        try {
            if (!newClient.name || !newClient.client_code) return alert("Nombre y Código son obligatorios");

            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    name: newClient.name,
                    contact_email: newClient.contact_email,
                    client_code: newClient.client_code,
                    enabled_modules: [] // Start with no modules
                }])
                .select();

            if (error) throw error;

            setClients([data[0], ...clients]);
            setNewClient({ name: '', contact_email: '', client_code: '' });
            alert("Cliente creado exitosamente");
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Error al crear cliente: ' + error.message);
        }
    };

    const toggleModule = async (client, moduleId) => {
        const currentModules = client.enabled_modules || [];
        let updatedModules;

        if (currentModules.includes(moduleId)) {
            updatedModules = currentModules.filter(m => m !== moduleId);
        } else {
            updatedModules = [...currentModules, moduleId];
        }

        try {
            // Optimistic Update
            setClients(clients.map(c => c.id === client.id ? { ...c, enabled_modules: updatedModules } : c));

            const { error } = await supabase
                .from('clients')
                .update({ enabled_modules: updatedModules })
                .eq('id', client.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating modules:', error);
            alert("Error al actualizar permisos");
            fetchClients(); // Revert on error
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando panel maestro...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-purple-600" />
                    Configuración Administrativa
                </h1>
                <p className="text-gray-600">Gestión maestra de clientes y asignación de módulos.</p>
            </header>

            {/* CREATE CLIENT FORM */}
            <section className="bg-white p-6 rounded-xl shadow-md mb-8 border border-slate-200">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus size={20} /> Alta de Nuevo Cliente
                </h2>
                <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Empresa</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded"
                            placeholder="Ej. Transportes del Norte"
                            value={newClient.name}
                            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Email Contacto</label>
                        <input
                            type="email"
                            className="w-full border p-2 rounded"
                            placeholder="contacto@empresa.com"
                            value={newClient.contact_email}
                            onChange={e => setNewClient({ ...newClient, contact_email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Código Único (ID)</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded font-mono bg-slate-50"
                            placeholder="Ej. cliente_05"
                            value={newClient.client_code}
                            onChange={e => setNewClient({ ...newClient, client_code: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 flex items-center justify-center gap-2">
                        <Save size={18} /> Crear Cliente
                    </button>
                </form>
            </section>

            {/* CLIENT LIST */}
            <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="p-4 border-b">Empresa</th>
                            <th className="p-4 border-b">Código</th>
                            <th className="p-4 border-b text-center">Módulos Activos</th>
                            <th className="p-4 border-b text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{client.name}</div>
                                    <div className="text-xs text-slate-500">{client.contact_email || 'Sin correo'}</div>
                                </td>
                                <td className="p-4">
                                    <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">
                                        {client.client_code}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {AVAILABLE_MODULES.map(module => {
                                            const isActive = client.enabled_modules?.includes(module.id);
                                            return (
                                                <button
                                                    key={module.id}
                                                    onClick={() => toggleModule(client, module.id)}
                                                    className={`
                                                        text-xs flex items-center gap-1 px-3 py-1 rounded-full border transition-all
                                                        ${isActive
                                                            ? 'bg-green-50 border-green-200 text-green-700 font-bold'
                                                            : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'}
                                                    `}
                                                    title={`Click para ${isActive ? 'desactivar' : 'activar'}`}
                                                >
                                                    {isActive ? <CheckSquare size={14} /> : <Square size={14} />}
                                                    {module.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Activo</span>
                                </td>
                            </tr>
                        ))}
                        {clients.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400">
                                    No hay clientes registrados aún. Usa el formulario de arriba.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default AdminDashboard;
