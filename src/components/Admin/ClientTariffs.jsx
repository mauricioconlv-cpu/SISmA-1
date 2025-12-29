import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Save, DollarSign, Truck, AlertCircle } from 'lucide-react';
import { SectionTitle, StyledInput } from '../Shared/UIComponents';
import { SERVICE_TYPES } from '../../utils/constants';

const ClientTariffs = ({ clientId, onBack }) => {
    const [client, setClient] = useState(null);
    const [tariffs, setTariffs] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [clientId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Client Name
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('name')
                .eq('id', clientId)
                .single();

            if (clientError) throw clientError;
            setClient(clientData);

            // 2. Fetch Existing Tariffs
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
                [field]: value
            }
        }));
    };

    const saveTariff = async (serviceType) => {
        setSaving(true);
        try {
            const current = tariffs[serviceType] || {};
            const payload = {
                client_id: clientId,
                service_type: serviceType,
                base_rate: parseFloat(current.base_rate) || 0,
                km_rate: parseFloat(current.km_rate) || 0,
                service_scope: 'local' // Default per spec
            };

            // UPSERT strategy: check if ID exists in local map to decide update vs insert?
            // Or just use upsert with unique constraint (client_id, service_type, service_scope).
            // But Supabase JS upsert works best if we match the columns.

            const { error } = await supabase
                .from('client_tariffs')
                .upsert(payload, { onConflict: 'client_id, service_type, service_scope' });

            if (error) throw error;

            // Re-fetch to get new IDs if inserted? Or just show success.
            // A simple toast would be nice, but alert is fine for now.
            alert(`Tarifa para ${serviceType} guardada.`);

        } catch (error) {
            console.error("Error saving tariff:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setSaving(false);
        }
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <SectionTitle title="Matriz de Precios por Servicio" icon={<DollarSign size={20} />} />
                    <p className="text-sm text-slate-500 mt-2">Defina el costo base (banderazo) y el costo por kilómetro para cada tipo de servicio.</p>
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                                    <th className="py-4 px-4 font-bold">Servicio</th>
                                    <th className="py-4 px-4 font-bold text-center w-40">Costo Base ($)</th>
                                    <th className="py-4 px-4 font-bold text-center w-40">Costo KM ($)</th>
                                    <th className="py-4 px-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(SERVICE_TYPES && Array.isArray(SERVICE_TYPES) ? SERVICE_TYPES : []).map((service) => {
                                    const rate = tariffs[service.id] || { base_rate: '', km_rate: '' };
                                    return (
                                        <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                                        <Truck size={20} />
                                                        {/* Ideally use service.icon dynamic mapping but Truck works for generic */}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{service.label}</p>
                                                        <p className="text-xs text-slate-400 capitalize">{service.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <StyledInput
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={rate.base_rate}
                                                    onChange={(e) => handleRateChange(service.id, 'base_rate', e.target.value)}
                                                    className="text-center font-mono text-sm"
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <StyledInput
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={rate.km_rate}
                                                    onChange={(e) => handleRateChange(service.id, 'km_rate', e.target.value)}
                                                    className="text-center font-mono text-sm"
                                                />
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => saveTariff(service.id)}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                                >
                                                    <Save size={14} /> Guardar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-start gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>
                    <strong>Nota:</strong> Los precios se guardan individualmente. Asegúrese de guardar cada fila tras modificarla.
                    El sistema usará el "Costo Base" como banderazo y sumará (KM * Costo KM) para servicios foráneos.
                </p>
            </div>
        </div>
    );
};

export default ClientTariffs;
