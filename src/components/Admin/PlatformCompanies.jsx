import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Building2, Search, Plus, Settings, Check, X, Box, Truck, Trash2 } from 'lucide-react';
import { SectionTitle, StyledInput } from '../Shared/UIComponents';

const PlatformCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
    const [showModulesModal, setShowModulesModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyModules, setCompanyModules] = useState(new Set());

    // --- LEGO CONFIGURATION DEFINITION ---
    const LEGO_CATEGORIES = {
        verticals: {
            title: "Verticales (Servicios)",
            icon: <Truck size={18} className="text-blue-500" />,
            items: [
                { key: 'tow', label: 'Grúas', desc: 'Gestión de servicios de grúa y arrastre.' },
                { key: 'medical', label: 'Ambulancias', desc: 'Despacho y control de unidades médicas.' },
                { key: 'home', label: 'Hogar / Plomería', desc: 'Servicios de asistencia en el hogar.' },
                { key: 'roadside', label: 'Vialidad', desc: 'Gasolina, cambio de llanta, paso de corriente.' }
            ]
        },
        modules: {
            title: "Módulos del Sistema",
            icon: <Box size={18} className="text-purple-500" />,
            items: [
                { key: 'finance', label: 'Finanzas', desc: 'Control de ingresos, egresos y facturación.' },
                { key: 'inventory', label: 'Inventario', desc: 'Gestión de refacciones y activos.' },
                { key: 'hr', label: 'Recursos Humanos', desc: 'Gestión de operadores y nómina.' }
            ]
        },
        integrations: {
            title: "Integraciones y Costos",
            icon: <Settings size={18} className="text-orange-500" />,
            items: [
                { key: 'google_maps', label: 'Google Maps API', desc: 'Autocompletado y cálculo de rutas (Costo Extra).' }
            ]
        }
    };

    useEffect(() => {
        fetchCompanies();
        // fetchAvailableModules(); // Replaced by static LEGO definition for Admin control
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCompanies(data || []);
        } catch (error) {
            console.error("Error fetching companies:", error);
        } finally {
            setLoading(false);
        }
    };

    const openModulesModal = async (company) => {
        // Refresh company data to ensure latest enabled_services
        const { data: refreshedCompany } = await supabase
            .from('companies')
            .select('enabled_services') // Fetch only what we need
            .eq('id', company.id)
            .single();

        // Merge with passed company object or just use the services
        const currentServices = refreshedCompany?.enabled_services || company.enabled_services || [];

        setSelectedCompany({ ...company, ...refreshedCompany }); // Update selected company
        setCompanyModules(new Set(currentServices));
        setShowModulesModal(true);
    };

    const toggleModule = async (moduleKey) => {
        const newSet = new Set(companyModules);

        if (newSet.has(moduleKey)) {
            newSet.delete(moduleKey);
        } else {
            newSet.add(moduleKey);
        }
        setCompanyModules(newSet);

        // SYNC enabled_services ARRAY in companies table (Source of Truth)
        const updatedArray = Array.from(newSet);

        // Optimistic UI Update in the main list
        setCompanies(companies.map(c =>
            c.id === selectedCompany.id
                ? { ...c, enabled_services: updatedArray }
                : c
        ));

        // Persist to DB
        const { error } = await supabase
            .from('companies')
            .update({ enabled_services: updatedArray })
            .eq('id', selectedCompany.id);

        if (error) {
            console.error("Error updating enabled_services:", error);
            alert("Error al guardar cambios. Revisa tu conexión.");
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        if (!password) {
            return alert("La contraseña provisional es obligatoria.");
        }

        // 1. Create Company
        const { data: company, error } = await supabase
            .from('companies')
            .insert([{ name, email, enabled_services: ['tow'] }]) // Default service
            .select()
            .single();

        if (error) {
            alert("Error creando empresa: " + error.message);
            return;
        }

        // 2. Create Owner User (via Backend API)
        try {
            const response = await fetch('/api/createUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: 'Admin ' + name, // Default owner name
                    email: email,
                    password: password,
                    rol: 'owner', // Special role for company creator
                    company_id: company.id,
                    permissions: ['all'] // Owners get all permissions by default
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("User creation failed:", result);
                alert(`Empresa creada, PERO hubo un error creando el usuario dueño: ${result.error}. Deberás crearlo manualmente en Gestión de Usuarios.`);
            } else {
                alert(`✅ Empresa "${name}" y usuario dueño creados exitosamente.\n\nEmail: ${email}\nPassword: ${password}`);
            }

        } catch (apiError) {
            console.error("API Error:", apiError);
            alert("Error de conexión al crear el usuario dueño.");
        }

        setShowNewCompanyModal(false);
        fetchCompanies();
    };

    const handleDeleteCompany = async (id, name) => {
        if (window.confirm(`⚠️ PELIGRO ⚠️\n\n¿Estás seguro de que deseas eliminar la empresa "${name}"?\n\nEsta acción eliminará TODOS los datos asociados (vehículos, servicios, usuarios, etc.) y NO se puede deshacer.`)) {
            try {
                // Call Serverless Function to handle cascade delete (Auth Users + Data)
                const response = await fetch('/api/deleteCompany', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ company_id: id })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Error desconocido al eliminar.");
                }

                alert("✅ Empresa y sus usuarios eliminados correctamente.");
                setCompanies(companies.filter(c => c.id !== id));

            } catch (error) {
                console.error("Error deleting company:", error);
                alert(`Error al eliminar empresa: ${error.message}`);
            }
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Empresas SaaS</h1>
                    <p className="text-slate-500">Gestión de inquilinos y configuración de módulos.</p>
                </div>
                <button
                    onClick={() => setShowNewCompanyModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Nueva Empresa
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar empresa por nombre o email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Dueño / Email</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-center">Módulos Activos</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCompanies.map(company => (
                            <tr key={company.id} className={`hover:bg-slate-50 transition-colors group ${!company.active ? 'opacity-60 bg-slate-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${company.active ? 'bg-purple-50 text-purple-600' : 'bg-slate-200 text-slate-500'}`}>
                                            {company.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className={`font-medium ${company.active ? 'text-slate-900' : 'text-slate-500'}`}>{company.name}</span>
                                            {!company.active && <span className="ml-2 text-xs text-red-500 font-bold">(Inactivo)</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {company.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={async () => {
                                            const newStatus = !company.active;
                                            // Optimistic Update
                                            setCompanies(companies.map(c => c.id === company.id ? { ...c, active: newStatus } : c));

                                            const { error } = await supabase
                                                .from('companies')
                                                .update({ active: newStatus })
                                                .eq('id', company.id);

                                            if (error) {
                                                console.error("Error updating status:", error);
                                                // Revert on error
                                                setCompanies(companies.map(c => c.id === company.id ? { ...c, active: !newStatus } : c));
                                                alert("Error al actualizar estado");
                                            }
                                        }}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${company.active ? 'bg-green-500' : 'bg-slate-300'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${company.active ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {(company.enabled_services || []).length}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openModulesModal(company)}
                                            className="text-slate-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-full"
                                            title="Configurar Módulos"
                                        >
                                            <Settings size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCompany(company.id, company.name)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                                            title="Eliminar Empresa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCompanies.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No se encontraron empresas.
                    </div>
                )}
            </div>

            {/* MODULES MODAL */}
            {showModulesModal && selectedCompany && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Configuración LEGO</h3>
                                <p className="text-sm text-slate-500">{selectedCompany.name}</p>
                            </div>
                            <button onClick={() => setShowModulesModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                            {/* Iterate over Categories */}
                            {Object.entries(LEGO_CATEGORIES).map(([catKey, category]) => (
                                <div key={catKey}>
                                    <div className="flex items-center gap-2 mb-4">
                                        {category.icon}
                                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{category.title}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {category.items.map(item => {
                                            const isActive = companyModules.has(item.key);
                                            return (
                                                <div key={item.key}
                                                    onClick={() => toggleModule(item.key)}
                                                    className={`relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${isActive
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-slate-100 hover:border-slate-200'
                                                        }`}>
                                                    <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${isActive ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                                                        }`}>
                                                        {isActive && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold ${isActive ? 'text-purple-900' : 'text-slate-700'}`}>{item.label}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* PASSWORD RESET SECTION */}
                        <div className="p-6 bg-orange-50 border-t border-orange-100">
                            <h4 className="font-bold text-orange-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Settings size={16} /> Administración de Acceso
                            </h4>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-orange-800 mb-1">Cambiar Contraseña del Dueño</label>
                                    <input
                                        type="text"
                                        placeholder="Nueva contraseña"
                                        className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        id="newOwnerPassword"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        const input = document.getElementById('newOwnerPassword');
                                        const newPass = input.value;
                                        if (!newPass) return alert("Escribe una contraseña");

                                        if (!selectedCompany.email) return alert("La empresa no tiene email asignado.");

                                        try {
                                            const res = await fetch('/api/resetPassword', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: selectedCompany.email, password: newPass })
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                alert("✅ Contraseña actualizada correctamente.");
                                                input.value = '';
                                            } else {
                                                alert("Error: " + data.error);
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert("Error de conexión");
                                        }
                                    }}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors"
                                >
                                    Actualizar
                                </button>
                            </div>
                            <p className="text-xs text-orange-700 mt-2">
                                Esto cambiará inmediatamente la contraseña del usuario <strong>{selectedCompany.email}</strong>.
                            </p>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
                            <button onClick={() => setShowModulesModal(false)} className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm">
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW COMPANY MODAL */}
            {showNewCompanyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="font-bold text-lg mb-4">Nueva Empresa SaaS</h3>
                        <form onSubmit={handleCreateCompany} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
                                <StyledInput name="name" placeholder="Ej. Grúas Express" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email del Dueño</label>
                                <StyledInput name="email" type="email" placeholder="owner@empresa.com" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Provisional</label>
                                <StyledInput name="password" type="text" placeholder="123456" required />
                                <p className="text-xs text-slate-500 mt-1">Se usará para crear la cuenta del dueño.</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowNewCompanyModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Crear Empresa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformCompanies;
