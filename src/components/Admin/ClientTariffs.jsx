
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, DollarSign, Truck, AlertCircle } from 'lucide-react';
import { SectionTitle, StyledInput } from '../Shared/UIComponents';
import { SERVICE_TYPES } from '../../utils/constants';

const ClientTariffs = ({ clientId, onBack }) => {
    const { user } = useAuth();
    const [client, setClient] = useState(null);
    const [tariffs, setTariffs] = useState({});
    const [allowedServices, setAllowedServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.company_id && clientId) {
            fetchData();
        }
    }, [clientId, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Company Configuration (Enabled Services)
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('enabled_services')
                .eq('id', user.company_id)
                .single();

            if (companyError) {
                console.error("Error fetching company config:", companyError);
                // Fallback or alert?
            }

            const enabled = companyData?.enabled_services || [];
            setAllowedServices(enabled);

            // 2. Fetch Client Name
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('name')
                .eq('id', clientId)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // 3. Fetch Existing Tariffs
            const { data: tariffData, error: tariffError } = await supabase
                .from('client_tariffs')
                .select('*')
                .eq('client_id', clientId);

            if (tariffError) throw tariffError;

            // Map to local dictionary for easier access: tariffs[service_type] = { ... }
            const tariffMap = {};
            if (tariffData) {
                tariffData.forEach(t => {
                    tariffMap[t.service_type] = t;
                });
            }
            setTariffs(tariffMap);

        } catch (error) {
            console.error("Error fetching tariffs:", error);
            alert("Error al cargar datos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (serviceType, field, value) => {
        setTariffs(prev => ({
            ...prev,
            [serviceType]: {
                ...prev[serviceType],
                pricing_matrix: {
                    ...(prev[serviceType]?.pricing_matrix || {}),
                    [field]: value
                }
            }
        }));
    };

    const saveTariff = async (serviceType) => {
        setSaving(true);
        try {
            const current = tariffs[serviceType] || {};
            const matrix = current.pricing_matrix || {};

            const payload = {
                client_id: clientId,
                service_type: serviceType,
                // Legacy Fallback (for existing logic that reads these columns)
                base_rate: parseFloat(matrix.banderazo) || 0,
                km_rate: parseFloat(matrix.km_rate) || 0,
                service_scope: 'flexible', // New flag
                pricing_matrix: matrix // The new powerhouse
            };

            const { error } = await supabase
                .from('client_tariffs')
                .upsert(payload, { onConflict: 'client_id, service_type, service_scope' });

            if (error) throw error;

            alert(`✅ Tarifas para ${serviceType} guardadas correctamente.`);

        } catch (error) {
            console.error("Error saving tariff:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando tarifas...</div>;

    // --- RENDER HELPERS ---
    const renderPricingFields = (serviceId, matrix, handleChange) => {
        // --- GRÚAS (A, B, C, D) ---
        if (['tow', 'plataforma', 'arrastre_a', 'arrastre_b', 'arrastre_c', 'arrastre_d'].includes(serviceId)) {
            return (
                <div className="space-y-6">
                    {/* TRASLADOS FORÁNEOS */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Traslados Foráneos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Banderazo ($)</label>
                                <StyledInput type="number" value={matrix.banderazo || ''} onChange={(e) => handleChange('banderazo', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Costo por KM ($)</label>
                                <StyledInput type="number" value={matrix.km_rate || ''} onChange={(e) => handleChange('km_rate', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Casetas (Factor)</label>
                                <StyledInput type="number" value={matrix.casetas_factor || ''} onChange={(e) => handleChange('casetas_factor', e.target.value)} placeholder="1.0" />
                            </div>
                        </div>
                    </div>

                    {/* TRASLADOS LOCALES */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Traslados Locales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Local Zona 1 ($)</label>
                                <StyledInput type="number" value={matrix.local_zone1 || ''} onChange={(e) => handleChange('local_zone1', e.target.value)} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Local Zona 2 ($)</label>
                                <StyledInput type="number" value={matrix.local_zone2 || ''} onChange={(e) => handleChange('local_zone2', e.target.value)} placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    {/* MANIOBRAS */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Maniobras y Adicionales</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['hora_espera', 'maniobra_base', 'adaptacion', 'resguardo_dia', 'dollys', 'patines', 'go_jacks', 'abanderamiento'].map(field => (
                                <div key={field}>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{field.replace('_', ' ')} ($)</label>
                                    <StyledInput type="number" value={matrix[field] || ''} onChange={(e) => handleChange(field, e.target.value)} placeholder="0.00" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BLINDAJES */}
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <h4 className="font-bold text-orange-800 text-sm uppercase tracking-wider mb-4 border-b border-orange-200 pb-2">Blindajes (Costo Extra)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
                                <div key={lvl}>
                                    <label className="block text-xs font-bold text-orange-700 mb-1">Nivel {lvl} ($)</label>
                                    <StyledInput type="number" value={matrix[`armor_lvl_${lvl}`] || ''} onChange={(e) => handleChange(`armor_lvl_${lvl}`, e.target.value)} placeholder="0.00" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // --- AUXILIO VIAL & GASOLINA ---
        if (['jump', 'tire', 'gas'].includes(serviceId)) {
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* FORÁNEO */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Foráneo</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Banderazo ($)</label>
                                    <StyledInput type="number" value={matrix.banderazo || ''} onChange={(e) => handleChange('banderazo', e.target.value)} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Kilómetro ($)</label>
                                    <StyledInput type="number" value={matrix.km_rate || ''} onChange={(e) => handleChange('km_rate', e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                        </div>

                        {/* LOCAL */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Local</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Zona 1 ($)</label>
                                    <StyledInput type="number" value={matrix.local_zone1 || ''} onChange={(e) => handleChange('local_zone1', e.target.value)} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Zona 2 ($)</label>
                                    <StyledInput type="number" value={matrix.local_zone2 || ''} onChange={(e) => handleChange('local_zone2', e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GASOLINA EXTRAS */}
                    {serviceId === 'gas' && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <h4 className="font-bold text-blue-800 text-sm uppercase tracking-wider mb-4">Costo Combustible (Por Litro)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 mb-1">Magna ($)</label>
                                    <StyledInput type="number" value={matrix.fuel_magna || ''} onChange={(e) => handleChange('fuel_magna', e.target.value)} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 mb-1">Premium ($)</label>
                                    <StyledInput type="number" value={matrix.fuel_premium || ''} onChange={(e) => handleChange('fuel_premium', e.target.value)} placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-700 mb-1">Diesel ($)</label>
                                    <StyledInput type="number" value={matrix.fuel_diesel || ''} onChange={(e) => handleChange('fuel_diesel', e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return <div className="text-slate-400 italic p-4">Configuración genérica para este servicio.</div>;
    };

    if (loading) return <div className="p-8 text-center">Cargando tarifas...</div>;

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-20">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Tarifas</h2>
                    <p className="text-slate-500">Cliente: <span className="font-bold text-blue-600">{client?.name}</span></p>
                </div>
            </div>

            <div className="space-y-4">
                {(SERVICE_TYPES || [])
                    .filter(s => allowedServices.includes(s.id))
                    .map((service) => {
                        // Get current matrix or initialize empty
                        const currentMatrix = tariffs[service.id]?.pricing_matrix || {};

                        return (
                            <details key={service.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden open:ring-2 open:ring-blue-500/20 transition-all">
                                <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold shadow-sm group-open:bg-blue-600 group-open:text-white transition-all">
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 group-open:text-blue-700">{service.label}</h3>
                                            <p className="text-xs text-slate-400 capitalize">{service.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 transform group-open:rotate-180 transition-transform">▼</span>
                                </summary>

                                <div className="p-6 border-t border-slate-100 bg-white animate-fade-in">
                                    {renderPricingFields(
                                        service.id,
                                        currentMatrix,
                                        (field, value) => handleRateChange(service.id, field, value)
                                    )}

                                    <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
                                        <button
                                            onClick={() => saveTariff(service.id)}
                                            disabled={saving}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50"
                                        >
                                            <Save size={18} /> Guardar Tarifas de {service.label}
                                        </button>
                                    </div>
                                </div>
                            </details>
                        );
                    })}
            </div>

            {allowedServices.length === 0 && (
                <div className="p-12 text-center bg-slate-100 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Este cliente no tiene servicios activos para configurar.</p>
                </div>
            )}
        </div>
    );
};

export default ClientTariffs;
