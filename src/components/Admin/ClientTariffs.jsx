import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, DollarSign, Truck, AlertCircle, Wrench, Zap, Disc, Battery, Fuel } from 'lucide-react';
import { SectionTitle, StyledInput } from '../Shared/UIComponents';
import { SERVICE_TYPES } from '../../utils/constants';

const ClientTariffs = ({ clientId, onBack }) => {
    const { user } = useAuth();
    const [client, setClient] = useState(null);
    const [tariffs, setTariffs] = useState({});
    const [allowedServices, setAllowedServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingState, setSavingState] = useState({}); // { serviceId: boolean }

    // --- CONFIGURATION: Define Granular Sections ---
    const TARIFF_CONFIG = [
        {
            id: 'arrastre_a',
            label: 'Grúa Tipo A (Compactos)',
            module: 'tow',
            icon: Truck,
            category: 'Grúas'
        },
        {
            id: 'arrastre_b',
            label: 'Grúa Tipo B (Pickups/Van)',
            module: 'tow',
            icon: Truck,
            category: 'Grúas'
        },
        {
            id: 'arrastre_c',
            label: 'Grúa Tipo C (3.5 Tons)',
            module: 'tow',
            icon: Truck,
            category: 'Grúas'
        },
        {
            id: 'arrastre_d',
            label: 'Grúa Tipo D (Camiones)',
            module: 'tow',
            icon: Truck,
            category: 'Grúas'
        },
        // Auxilio Vial (Roadside)
        {
            id: 'jump',
            label: 'Paso de Corriente',
            module: 'roadside', // or 'tow' depending on company setup. Assuming 'tow' or specific
            icon: Battery,
            category: 'Auxilio Vial'
        },
        {
            id: 'tire',
            label: 'Cambio de Llanta',
            module: 'roadside',
            icon: Disc,
            category: 'Auxilio Vial'
        },
        {
            id: 'gas',
            label: 'Suministro de Gasolina',
            module: 'roadside',
            icon: Fuel,
            category: 'Auxilio Vial'
        }
    ];

    useEffect(() => {
        // Fix: Allow fetch if user exists (even if no company_id for SuperAdmin or edge cases)
        // Only block if no user is logged in
        if (user && clientId) {
            fetchData();
        } else {
            setLoading(false); // Ensure we stop loading if requirements aren't met
        }
    }, [clientId, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Company Config
            let companyModules = [];

            if (user.company_id) {
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('enabled_services')
                    .eq('id', user.company_id)
                    .single();
                companyModules = companyData?.enabled_services || [];
            } else if (['superadmin', 'super_admin', 'owner'].includes(user.rol || user.role)) {
                // SUPER ADMIN FALLBACK: Enable ALL services if no company_id (God Mode / Direct Owner)
                companyModules = ['tow', 'roadside', 'medical', 'home'];
            }

            // Map legacy 'grua', 'corriente' to new module keys if necessary, or rely on 'tow'/'roadside'
            // For simplicity, if company has 'tow', we show all tow types.
            // If company has 'corriente' or 'llanta', we show those.

            // Normalize modules to check against TARIFF_CONFIG
            // If config.module is 'tow', check if companyModules has 'tow' OR 'grua'
            const normalizedModules = new Set(companyModules);
            if (normalizedModules.has('grua')) normalizedModules.add('tow');
            if (normalizedModules.has('corriente')) normalizedModules.add('roadside');
            if (normalizedModules.has('llanta')) normalizedModules.add('roadside');
            if (normalizedModules.has('gasolina')) normalizedModules.add('roadside');

            setAllowedServices(Array.from(normalizedModules));

            // 2. Fetch Client
            const { data: clientData } = await supabase
                .from('clients')
                .select('name')
                .eq('id', clientId)
                .single();
            setClient(clientData);

            // 3. Fetch Tariffs
            const { data: tariffData, error } = await supabase
                .from('client_tariffs')
                .select('*')
                .eq('client_id', clientId);

            if (error) throw error;

            const tariffMap = {};
            if (tariffData) {
                tariffData.forEach(t => {
                    tariffMap[t.service_type] = t;
                });
            }
            setTariffs(tariffMap);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (serviceId, field, value) => {
        setTariffs(prev => ({
            ...prev,
            [serviceId]: {
                ...prev[serviceId],
                pricing_matrix: {
                    ...(prev[serviceId]?.pricing_matrix || {}),
                    [field]: value
                }
            }
        }));
    };

    const saveTariff = async (serviceId) => {
        setSavingState(prev => ({ ...prev, [serviceId]: true }));
        try {
            const current = tariffs[serviceId] || {};
            const matrix = current.pricing_matrix || {};

            const payload = {
                client_id: clientId,
                service_type: serviceId,
                pricing_matrix: matrix,
                service_scope: 'flexible',
                // Legacy fields sync
                base_rate: parseFloat(matrix.banderazo) || 0,
                km_rate: parseFloat(matrix.km_rate) || 0
            };

            const { error } = await supabase
                .from('client_tariffs')
                .upsert(payload, { onConflict: 'client_id, service_type, service_scope' });

            if (error) throw error;
            // Removed alert to avoid spamming user
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setSavingState(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    const renderCommonFields = (serviceId, matrix) => {
        return (
            <div className="space-y-6">
                {/* 1. TRASLADOS (Foraneo / Local) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FORÁNEO */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Foráneo</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Banderazo</label>
                                <StyledInput type="number" value={matrix.banderazo || ''} onChange={(e) => handleRateChange(serviceId, 'banderazo', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Costo KM</label>
                                <StyledInput type="number" value={matrix.km_rate || ''} onChange={(e) => handleRateChange(serviceId, 'km_rate', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Factor Casetas</label>
                                <StyledInput type="number" value={matrix.casetas_factor || ''} onChange={(e) => handleRateChange(serviceId, 'casetas_factor', e.target.value)} placeholder="1.0" />
                            </div>
                        </div>
                    </div>

                    {/* LOCAL */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Local</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Zona 1</label>
                                <StyledInput type="number" value={matrix.local_zone1 || ''} onChange={(e) => handleRateChange(serviceId, 'local_zone1', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Zona 2</label>
                                <StyledInput type="number" value={matrix.local_zone2 || ''} onChange={(e) => handleRateChange(serviceId, 'local_zone2', e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. EXTRAS / MANIOBRAS */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Maniobras y Adicionales</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { k: 'maniobra_base', l: 'Maniobra Base' },
                            { k: 'hora_espera', l: 'Hora Espera' },
                            { k: 'abanderamiento', l: 'Abanderamiento' },
                            { k: 'resguardo_dia', l: 'Resguardo (Día)' },
                            { k: 'dollys', l: 'Uso de Dollys' },
                            { k: 'patines', l: 'Uso de Patines' },
                            { k: 'go_jacks', l: 'Go-Jacks' },
                            { k: 'nivel_subterraneo', l: 'Nivel Subterraneo' },
                            { k: 'adaptacion', l: 'Adaptación' },
                            { k: 'horario_nocturno', l: 'Horario Nocturno (%)', placeholder: '%' }
                        ].map(item => (
                            <div key={item.k}>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">{item.l}</label>
                                <StyledInput
                                    type="number"
                                    value={matrix[item.k] || ''}
                                    onChange={(e) => handleRateChange(serviceId, item.k, e.target.value)}
                                    placeholder={item.placeholder || "0.00"}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. BLINDAJES (Only for Tow types usually, but fine generally) */}
                {serviceId.includes('arrastre') || serviceId.includes('plataforma') ? (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <h4 className="font-bold text-orange-800 text-xs uppercase tracking-wider mb-4 border-b border-orange-200 pb-2">Blindajes</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
                                <div key={lvl}>
                                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Nvl {lvl}</label>
                                    <StyledInput type="number" value={matrix[`armor_lvl_${lvl}`] || ''} onChange={(e) => handleRateChange(serviceId, `armor_lvl_${lvl}`, e.target.value)} placeholder="0.00" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}

                {/* 4. GASOLINA SPECIFIC */}
                {serviceId === 'gas' && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-800 text-xs uppercase tracking-wider mb-4 border-b border-blue-200 pb-2">Combustible (Litro)</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="block text-[10px] font-bold text-blue-700">Magna</label><StyledInput type="number" value={matrix.fuel_magna || ''} onChange={e => handleRateChange(serviceId, 'fuel_magna', e.target.value)} /></div>
                            <div><label className="block text-[10px] font-bold text-blue-700">Premium</label><StyledInput type="number" value={matrix.fuel_premium || ''} onChange={e => handleRateChange(serviceId, 'fuel_premium', e.target.value)} /></div>
                            <div><label className="block text-[10px] font-bold text-blue-700">Diesel</label><StyledInput type="number" value={matrix.fuel_diesel || ''} onChange={e => handleRateChange(serviceId, 'fuel_diesel', e.target.value)} /></div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando tarifas...</div>;

    const sectionsToRender = TARIFF_CONFIG.filter(section => {
        // Show section if its module is in allowedServices
        // map 'tow' -> allows all arrastre/platform
        // map 'roadside' -> allows jump, tire, gas
        return allowedServices.includes(section.module) || allowedServices.includes('all');
    });

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8 sticky top-0 bg-slate-50 z-10 py-4 border-b border-slate-200">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Tarifas por Servicio</h2>
                    <p className="text-slate-500">Configurando: <span className="font-bold text-blue-600">{client?.name}</span></p>
                </div>
            </div>

            <div className="space-y-4">
                {sectionsToRender.map((section) => {
                    const currentMatrix = tariffs[section.id]?.pricing_matrix || {};
                    const isSaving = savingState[section.id];

                    return (
                        <details key={section.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden open:ring-2 open:ring-blue-500/20 transition-all">
                            <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors select-none">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm transition-all
                                        ${section.id.includes('arrastre') ? 'bg-blue-50 text-blue-600 group-open:bg-blue-600 group-open:text-white' : 'bg-emerald-50 text-emerald-600 group-open:bg-emerald-600 group-open:text-white'}
                                    `}>
                                        <section.icon size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm group-open:text-blue-700">{section.label}</h3>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{section.category}</p>
                                    </div>
                                </div>
                                <span className="text-slate-400 transform group-open:rotate-180 transition-transform">▼</span>
                            </summary>

                            <div className="p-6 border-t border-slate-100 bg-white animate-fade-in cursor-default">
                                {renderCommonFields(section.id, currentMatrix)}

                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => saveTariff(section.id)}
                                        disabled={isSaving}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                                    </button>
                                </div>
                            </div>
                        </details>
                    );
                })}

                {sectionsToRender.length === 0 && (
                    <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No hay módulos de servicio activos para esta empresa.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientTariffs;
