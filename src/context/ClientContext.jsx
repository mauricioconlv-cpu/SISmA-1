import React, { createContext, useState, useContext, useEffect } from 'react';
import { DEFAULT_CLIENTES, ROLES } from '../utils/constants';
import { useAuth } from './AuthContext';

const ClientContext = createContext(null);

export const ClientProvider = ({ children }) => {
    const { user } = useAuth();
    const [allClients, setAllClients] = useState([]); // The full database
    const [clients, setClients] = useState([]); // The filtered view for the current user
    const [loading, setLoading] = useState(true);

    // 1. Load All Clients from DB
    useEffect(() => {
        const storedClients = localStorage.getItem('towing_clients_db');
        if (storedClients) {
            setAllClients(JSON.parse(storedClients));
        } else {
            // Initialize with default strings converted to objects
            // Assign them to a default company (e.g., ID 1) or leave null if global
            // For this migration, let's assume they belong to the first company or are legacy
            const initialClients = DEFAULT_CLIENTES.map((name, index) => ({
                id: Date.now() + index,
                name: name,
                companyId: 1, // Defaulting legacy clients to Company ID 1 for now
                rfc: '',
                address: '',
                email: '',
                rates: {
                    tarifaLocal: 0, tarifaKm: 0, banderazo: 0,
                    maniobraBase: 0, esperaHora: 0, horarioNocturno: 0, pasoCorriente: 0, cambioLlanta: 0, suministroGasolina: 0, resguardoDia: 0,
                    adaptacion: 0, cargaKg: 0, acondicionamiento: 0, rescate: 0, nivelSubterraneo: 0,
                    dollys: 0, patines: 0, goJacks: 0
                }
            }));
            setAllClients(initialClients);
            localStorage.setItem('towing_clients_db', JSON.stringify(initialClients));
        }
        setLoading(false);
    }, []);

    // 2. Filter Clients based on User Role & Company
    useEffect(() => {
        if (!user) {
            setClients([]);
            return;
        }

        if (user.rol === ROLES.SUPERADMIN) {
            // Super Admin sees ALL clients
            setClients(allClients);
        } else {
            // Regular users see only their company's clients
            const filtered = allClients.filter(c => c.companyId === user.company_id);
            setClients(filtered);
        }
    }, [user, allClients]);

    const saveClientsToStorage = (updatedList) => {
        setAllClients(updatedList);
        localStorage.setItem('towing_clients_db', JSON.stringify(updatedList));
    };

    const addClient = (clientData) => {
        if (!user) return;

        const newClient = {
            id: Date.now(),
            companyId: user.company_id, // Auto-assign current user's company
            ...clientData
        };

        // If Super Admin creates a client, they might want to assign it to a specific company
        // For now, if Super Admin (company_id null), let's warn or default to 0?
        // Ideally Super Admin should select company, but per instructions: "newClient.companyId = currentUser.companyId"
        // If Super Admin has null companyId, the client becomes "Global" or "Unassigned".
        // Let's stick to the instruction.

        const updated = [...allClients, newClient];
        saveClientsToStorage(updated);
        return newClient;
    };

    const updateClient = (id, clientData) => {
        const updated = allClients.map(c => c.id === id ? { ...c, ...clientData } : c);
        saveClientsToStorage(updated);
    };

    const deleteClient = (id) => {
        if (window.confirm("¿Seguro que desea eliminar este cliente?")) {
            const updated = allClients.filter(c => c.id !== id);
            saveClientsToStorage(updated);
        }
    };

    return (
        <ClientContext.Provider value={{ clients, addClient, updateClient, deleteClient, loading }}>
            {children}
        </ClientContext.Provider>
    );
};

export const useClients = () => useContext(ClientContext);
