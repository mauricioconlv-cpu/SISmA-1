import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Building2, Search, Plus, Settings, Check, X, Box } from 'lucide-react';
import { SectionTitle, StyledInput } from '../Shared/UIComponents';

const PlatformCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
    const [showModulesModal, setShowModulesModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [availableModules, setAvailableModules] = useState([]);
    const [companyModules, setCompanyModules] = useState(new Set());

    useEffect(() => {
        fetchCompanies();
        fetchAvailableModules();
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

    const fetchAvailableModules = async () => {
        // Fetch from catalog
        const { data, error } = await supabase
            .from('app_modules')
            .select('*');

        if (!error && data) {
            setAvailableModules(data);
        } else {
            // Fallback if table doesn't exist yet/empty
            console.warn("Could not fetch app_modules, using defaults");
            setAvailableModules([
                { box_key: 'tow', label: 'Grúas' },
                { box_key: 'jump', label: 'Paso de Corriente' },
                { box_key: 'tire', label: 'Cambio de Llanta' },
                { box_key: 'gas', label: 'Suministro Gasolina' },
                { box_key: 'finance', label: 'Finanzas' },
            ]);
        }
    };

    const openModulesModal = async (company) => {
        setSelectedCompany(company);
        // Fetch current modules for this company
        const { data, error } = await supabase
            .from('company_modules')
            .select('module_key')
            .eq('company_id', company.id)
            .eq('is_active', true);

        if (data) {
            setCompanyModules(new Set(data.map(m => m.module_key)));
        } else {
            setCompanyModules(new Set());
        }
        setShowModulesModal(true);
    };

    const toggleModule = async (moduleKey) => {
        const newSet = new Set(companyModules);
        let action = '';

        if (newSet.has(moduleKey)) {
            newSet.delete(moduleKey);
            action = 'remove';
        } else {
            newSet.add(moduleKey);
            action = 'add';
        }
        setCompanyModules(newSet);

        // Optimistic UI, but need to save to DB
        // Save to company_modules
        if (action === 'add') {
            await supabase.from('company_modules').upsert({
                company_id: selectedCompany.id,
                module_key: moduleKey,
                is_active: true
            }, { onConflict: 'company_id, module_key' });
        } else {
            await supabase.from('company_modules')
                .delete()
                .eq('company_id', selectedCompany.id)
                .eq('module_key', moduleKey);
        }

        // SYNC enabled_services ARRAY in companies table (Connectivity Glue)
        const updatedArray = Array.from(newSet);
        await supabase.from('companies').update({
            enabled_services: updatedArray
        }).eq('id', selectedCompany.id);
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');

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

        // 2. We can't create auth user from here easily without service role.
        // We will just create a placeholder profile if possible or just stop here.
        alert("Empresa creada. El dueño debe registrarse con este email: " + email);

        setShowNewCompanyModal(false);
        fetchCompanies();
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
                            <th className="px-6 py-4 text-center">Módulos Activos</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCompanies.map(company => (
                            <tr key={company.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                                            {company.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-slate-900">{company.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {company.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {(company.enabled_services || []).length}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => openModulesModal(company)}
                                        className="text-slate-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-full"
                                        title="Configurar Módulos"
                                    >
                                        <Settings size={18} />
                                    </button>
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Configuración LEGO</h3>
                                <p className="text-sm text-slate-500">{selectedCompany.name}</p>
                            </div>
                            <button onClick={() => setShowModulesModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {availableModules.map(module => {
                                const isActive = companyModules.has(module.box_key);
                                return (
                                    <div key={module.box_key}
                                        onClick={() => toggleModule(module.box_key)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${isActive
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-slate-100 hover:border-slate-200'
                                            }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <p className={`font-bold ${isActive ? 'text-purple-900' : 'text-slate-600'}`}>{module.label}</p>
                                                <p className="text-xs text-slate-400">{module.description || 'Módulo del sistema'}</p>
                                            </div>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-purple-600' : 'bg-slate-200'
                                            }`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all transform ${isActive ? 'left-7' : 'left-1'
                                                }`} />
                                        </div>
                                    </div>
                                );
                            })}
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
