import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { ROLES } from '../utils/constants';

const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClients = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // RLS will handle the filtering by company_id automatically
            // FORCE FILTER BY COMPANY_ID (Explicit Multi-tenancy)
            let query = supabase.from('clients')
                .select('*')
                .eq('company_id', user.company_id)
                .is('deleted_at', null) // SOFT DELETE FILTER
                .order('name');
            const { data: clientsData, error: clientsError } = await query;

            if (clientsError) throw clientsError;

            // 2. Fetch Tariffs for these clients
            // We fetch all tariffs associated with the loaded clients to avoid N+1
            const clientIds = clientsData.map(c => c.id);
            let tariffMap = {}; // client_id -> { service_type: data }

            if (clientIds.length > 0) {
                const { data: tariffsData, error: tariffsError } = await supabase
                    .from('client_tariffs')
                    .select('*')
                    .in('client_id', clientIds);

                if (tariffsError) {
                    console.error("Error fetching tariffs:", tariffsError);
                } else if (tariffsData) {
                    // Group by client_id
                    tariffsData.forEach(t => {
                        if (!tariffMap[t.client_id]) tariffMap[t.client_id] = {};
                        tariffMap[t.client_id][t.service_type] = t;
                    });
                }
            }

            // 3. Merge Tariffs into Clients
            const clientsWithRates = clientsData.map(c => {
                const cTariffs = tariffMap[c.id] || {};

                // Legacy 'rates' support for ServiceWizard/Step2
                // We default to 'tow' (grua) rates as the primary fallback, or the first available
                const primaryTariff = cTariffs['tow'] || cTariffs['grua'] || Object.values(cTariffs)[0] || { base_rate: 0, km_rate: 0 };

                return {
                    ...c,
                    tariffs: cTariffs,
                    // Map new structure to old expected structure for Step 2
                    rates: {
                        ...c.rates, // keep any existing if JSON col still exists
                        tarifaLocal: primaryTariff.base_rate,
                        banderazo: primaryTariff.base_rate,
                        tarifaKm: primaryTariff.km_rate,
                        // Add specific overrides if needed
                        horarioNocturno: 0, // Default 0 as we don't have this in simple table yet
                    }
                };
            });

            setClients(clientsWithRates);

        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchClients();
        }
    }, [user]);

    const addClient = async (clientData) => {
        try {
            // STRICT VALIDATION: Company ID is mandatory for Data Ownership
            const targetCompanyId = user?.company_id || user?.companyId;

            if (!targetCompanyId && user?.role !== ROLES.SUPERADMIN) {
                console.error("FATAL: User has no company_id assigned. Cannot create client.");
                alert("Error Crítico: Su usuario no tiene una empresa asignada. Contacte a soporte.");
                return;
            }

            // Prepare payload
            const newClientPayload = {
                company_id: targetCompanyId, // CRITICAL: Must be populated
                name: clientData.name,
                rfc: clientData.rfc,
                address: clientData.address,
                contact_info: clientData.email, // Mapping UI email to contact_info
                logo: clientData.logo
                // Active defaults to true
            };

            const { data, error } = await supabase
                .from('clients')
                .insert([newClientPayload])
                .select()
                .single();

            if (error) throw error;

            setClients([...clients, { ...data, rates: {} }]); // Optimistic update
            return data;
        } catch (error) {
            console.error("Error adding client:", error);
            alert("Error al guardar cliente: " + error.message);
        }
    };

    const updateClient = async (id, clientData) => {
        try {
            const updatePayload = {
                name: clientData.name,
                rfc: clientData.rfc,
                address: clientData.address,
                contact_info: clientData.email,
                logo: clientData.logo
            };

            const { error } = await supabase
                .from('clients')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;

            fetchClients(); // Refresh to be safe
        } catch (error) {
            console.error("Error updating client:", error);
            alert("Error al actualizar: " + error.message);
        }
    };

    const deleteClient = async (id) => {
        if (!window.confirm("¿Seguro que desea eliminar este cliente?")) return;

        try {
            // SOFT DELETE IMPLEMENTATION
            const { error } = await supabase
                .from('clients')
                .update({ deleted_at: new Date() })
                .eq('id', id);

            if (error) throw error;

            setClients(clients.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting client:", error);
            alert("Error al eliminar: " + error.message);
        }
    };

    return (
        <ClientContext.Provider value={{ clients, addClient, updateClient, deleteClient, loading }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClients = () => useContext(ClientContext);
