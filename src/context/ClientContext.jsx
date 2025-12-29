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
            // RLS will handle the filtering by company_id automatically, but we can be explicit
            let query = supabase.from('clients').select('*').order('name');

            // If superadmin, maybe we want to see all? RLS might block unless policy allows.
            // For now, let's just fetch what RLS gives us.
            const { data, error } = await query;

            if (error) throw error;

            // Transform/enrich if needed (e.g. rate parsing if JSON? No, rates are in tariffs table now)
            // Wait, the UI expects 'rates' object attached to client from the previous code.
            // The new architecture splits tariffs to 'client_tariffs' table.
            // For this STEP (Create/List Clients), we don't need rates yet.
            // But the UI might crash if 'rates' is missing?
            // Let's add a dummy rates object or fetch it if needed.
            // The user said: "Importante: Por ahora solo quiero poder CREAR y LISTAR a los clientes (las empresas). En el siguiente paso nos meteremos con sus tarifas."
            // So I will return the client data as is.

            // Wait, existing UI (ClientManagement) heavily relies on 'rates' property.
            // I should probably inject a safe default 'rates' object so the UI doesn't crash on null.
            const clientsWithSafeRates = data.map(c => ({
                ...c,
                rates: c.rates || {} // Legacy support just in case, or empty obj
            }));

            setClients(clientsWithSafeRates);

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
            if (!user?.company_id && user?.role !== ROLES.SUPERADMIN) {
                alert("Error: No tienes una empresa asignada.");
                return;
            }

            // Prepare payload
            const newClientPayload = {
                company_id: user.company_id, // RLS requires this (or policy check)
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
            const { error } = await supabase
                .from('clients')
                .delete()
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
