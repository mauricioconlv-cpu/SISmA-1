import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const ServiceContext = createContext();

export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        // throw new Error('useServices must be used within a ServiceProvider');
        console.warn("ServiceContext is missing. Returning empty state.");
        return {
            services: [],
            addService: async () => { },
            updateService: async () => { },
            getServiceByFolio: () => null,
            getNextFolio: () => 0,
            catalogs: {},
            updateCatalogs: () => { }
        };

    }
    return context;
};

// CONSTANTE ID CLIENTE 1
const CLIENTE_1_EMAIL = 'gruaslafundicion@gmail.com';
const CLIENTE_1_ID = 'cliente_01'; // O el UUID real si lo tuviéramos

export const ServiceProvider = ({ children }) => {
    const { user } = useAuth(); // Accedemos al usuario actual

    // Initialize from localStorage or empty array
    const [services, setServices] = useState(() => {
        try {
            const saved = localStorage.getItem('towing_services');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error loading services from localStorage", error);
            return [];
        }
    });

    // Persist to localStorage whenever services change
    useEffect(() => {
        try {
            localStorage.setItem('towing_services', JSON.stringify(services));
        } catch (error) {
            console.error("Error saving services to localStorage", error);
        }
    }, [services]);

    // --- FETCH SERVICES FROM SUPABASE (Single Source of Truth) ---
    const fetchServices = async () => {
        // Enforce Company logic
        const companyId = user?.company_id || user?.company?.id;

        if (!user || !companyId) {
            console.log("⏳ Fetch Services delayed: Waiting for User/Company ID...");
            return;
        }

        console.log("🔄 Fetching ALL Services for Company:", companyId);

        try {
            // QUERY REFACTOR: Fetch ALL services for this company, no status filter
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false }); // Newest first

            if (error) throw error;

            if (data) {
                console.log(`✅ Loaded ${data.length} services from DB.`);
                // Merge strategies could go here, but for now, DB is truth
                // We map to ensure JSON/JSONB fields are objects if they come as null (optional safety)
                const safeData = data.map(s => ({
                    ...s,
                    vehicle_data: s.vehicle_data || {},
                    assignment_data: s.assignment_data || {},
                    logs: s.logs || []
                }));
                setServices(safeData);
            }
        } catch (error) {
            console.error("❌ Error fetching services:", error);
        }
    };

    // Auto-Fetch on mount/user change
    useEffect(() => {
        fetchServices();

        // Polling (Optional: every 30s to keep fresh)
        // const interval = setInterval(fetchServices, 30000);
        // return () => clearInterval(interval);
    }, [user?.company_id]); // Re-run when company_id is ready


    const addService = async (newService) => {
        // 1. Update Local State (Optimistic UI)
        setServices(prev => {
            const exists = prev.find(s => s.folio === newService.folio);
            if (exists) {
                return prev.map(s => s.folio === newService.folio ? { ...s, ...newService } : s);
            }
            return [...prev, newService];
        });

        // 2. Persist to Supabase
        try {
            // Construct JSONB objects from flat fields
            // SHIELDING: Ensure these are objects, even if empty
            const vehicle_data = {
                vehiculo: newService.vehiculo,
                marca: newService.marca,
                submarca: newService.submarca,
                placas: newService.placas,
                color: newService.color,
                descripcionDanios: newService.descripcionDanios,
                fotosDanios: newService.fotosDanios,
                tipoFalla: newService.tipoFalla,
                especifiqueFalla: newService.especifiqueFalla,
                maniobra: {
                    vehiculoEnNeutral: newService.vehiculoEnNeutral,
                    tipoTransmision: newService.tipoTransmision,
                    llantasGiran: newService.llantasGiran,
                    volanteGira: newService.volanteGira,
                    vehiculoPieCalle: newService.vehiculoPieCalle,
                    ubicacionDetalle: newService.ubicacionDetalle,
                    tipoGarage: newService.tipoGarage,
                    nivelEstacionamiento: newService.nivelEstacionamiento,
                    tipoRampa: newService.tipoRampa,
                    alturaEstacionamiento: newService.alturaEstacionamiento,
                    fotosManiobra: newService.fotosManiobra
                }
            };

            const assignment_data = {
                grua: newService.grua,
                operador: newService.operador,
                tiempoArribo: newService.tiempoArribo,
                horaAsignacion: newService.horaAsignacion,
                horaArribo: newService.horaArribo,
                horaContacto: newService.horaContacto,
                horaTermino: newService.horaTermino,
                craneCoords: newService.craneCoords,
                odometer: newService.odometer,
                totalDistanceKm: newService.totalDistanceKm,
                estimatedFinalOdometer: newService.estimatedFinalOdometer
            };

            const financial_data = {
                quotation: newService.quotation,
                billableDistance: newService.billableDistance
            };

            // --- VALIDACIÓN CORREGIDA (VERSIÓN FINAL) ---
            const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

            let validClientId = newService.clientId;

            // LÓGICA ESPECIAL CLIENTE 1
            if (user && user.email === CLIENTE_1_EMAIL) {
                console.info("🔒 Detectado Cliente 1. Forzando client_id de La Fundición.");
                validClientId = CLIENTE_1_ID;
            }

            // TRUCO: Convertimos a String() para poder medir el largo aunque sea un número
            if (!validClientId || String(validClientId).length < 2) { // Bajé la validación de largo 30 a 2 para permitir 'cliente_01'
                // Si NO es cliente 1 y el ID es inválido, usamos Dummy
                if (validClientId !== CLIENTE_1_ID) {
                    console.warn("⚠️ ID inválido corregido automáticamente. Usando Dummy.");
                    validClientId = DUMMY_UUID;
                }
            }

            // --- VALIDACIÓN CRÍTICA COMPANY_ID ---
            const validCompanyId = user?.company_id || user?.company?.id;

            if (!validCompanyId) {
                console.error("⛔ CRITICAL: Intentando guardar servicio sin company_id");
                throw new Error("Error de Integridad: No se ha detectado una empresa asignada a tu sesión. Por favor recarga la página.");
            }

            const serviceToInsert = {
                // Columnas Fijas que SÍ existen en Supabase
                folio: newService.folio || getNextFolio(),
                client_id: validClientId,
                company_id: validCompanyId, // ENFORCE DATA OWNERSHIP
                status: 'Activo',

                // Columnas JSONB (Aquí adentro va todo lo demás)
                vehicle_data: vehicle_data || {},
                assignment_data: assignment_data || {},

                // Agregamos logs como array vacío
                logs: []
            };

            // ASEGURAR QUE NO ENVIAMOS ID (para que Supabase lo genere)
            delete serviceToInsert.id;

            console.log("Payload LIMPIO enviado a Supabase:", serviceToInsert);

            const { data, error } = await supabase
                .from('services')
                .insert([serviceToInsert])
                .select();

            if (error) {
                console.error("Error DETALLADO de Supabase:", error.message, error.details);
                throw error;
            }
            return data;
        } catch (error) {
            console.error("Fallo crítico al guardar en DB:", error);
            // Re-throw so the UI knows it failed
            throw error;
        }
    };

    const updateService = async (folio, updatedData) => {
        // 1. Update Local State
        setServices(prev => prev.map(service =>
            service.folio === folio ? { ...service, ...updatedData } : service
        ));

        // 2. Persist to Supabase
        try {
            // Construct JSONB objects for update
            const vehicle_data = {
                vehiculo: updatedData.vehiculo,
                marca: updatedData.marca,
                submarca: updatedData.submarca,
                placas: updatedData.placas,
                color: updatedData.color,
                descripcionDanios: updatedData.descripcionDanios,
                fotosDanios: updatedData.fotosDanios,
                tipoFalla: updatedData.tipoFalla,
                especifiqueFalla: updatedData.especifiqueFalla,
                maniobra: {
                    vehiculoEnNeutral: updatedData.vehiculoEnNeutral,
                    tipoTransmision: updatedData.tipoTransmision,
                    llantasGiran: updatedData.llantasGiran,
                    volanteGira: updatedData.volanteGira,
                    vehiculoPieCalle: updatedData.vehiculoPieCalle,
                    ubicacionDetalle: updatedData.ubicacionDetalle,
                    tipoGarage: updatedData.tipoGarage,
                    nivelEstacionamiento: updatedData.nivelEstacionamiento,
                    tipoRampa: updatedData.tipoRampa,
                    alturaEstacionamiento: updatedData.alturaEstacionamiento,
                    fotosManiobra: updatedData.fotosManiobra
                }
            };

            const assignment_data = {
                grua: updatedData.grua,
                operador: updatedData.operador,
                tiempoArribo: updatedData.tiempoArribo,
                horaAsignacion: updatedData.horaAsignacion,
                horaArribo: updatedData.horaArribo,
                horaContacto: updatedData.horaContacto,
                horaTermino: updatedData.horaTermino,
                craneCoords: updatedData.craneCoords,
                odometer: updatedData.odometer,
                totalDistanceKm: updatedData.totalDistanceKm,
                estimatedFinalOdometer: updatedData.estimatedFinalOdometer
            };

            const financial_data = {
                quotation: updatedData.quotation,
                billableDistance: updatedData.billableDistance
            };

            // --- VALIDACIÓN CORREGIDA PARA UPDATE ---
            const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

            let validClientId = updatedData.clientId;

            // LÓGICA ESPECIAL CLIENTE 1 (También en Update para asegurar integridad)
            if (user && user.email === CLIENTE_1_EMAIL) {
                validClientId = CLIENTE_1_ID;
            }

            // TRUCO: Convertimos a String() para poder medir el largo aunque sea un número
            if (!validClientId || String(validClientId).length < 2) {
                if (validClientId !== CLIENTE_1_ID) {
                    console.warn("⚠️ ID inválido en UPDATE corregido automáticamente. Usando Dummy.");
                    validClientId = DUMMY_UUID;
                }
            }

            // 3. PREPARAR PAYLOAD LIMPIO
            const serviceToUpdate = {
                // Campos top-level permitidos
                client_id: validClientId, // Usamos el ID validado

                // JSONB columns
                vehicle_data: vehicle_data || {},
                assignment_data: assignment_data || {},

                logs: updatedData.auditLog || []
            };

            // Ya no necesitamos borrar claves manualmente porque construimos el objeto limpio desde cero

            const { data, error } = await supabase
                .from('services')
                .update(serviceToUpdate)
                .eq('folio', folio)
                .select();

            if (error) {
                console.error("Error al actualizar en Supabase:", error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error("Fallo crítico al actualizar en DB:", error);
            throw error;
        }
    };

    const getServiceByFolio = (folio) => {
        return services.find(s => s.folio === folio);
    };

    const getNextFolio = () => {
        if (services.length === 0) return 1001;
        const maxFolio = Math.max(...services.map(s => parseInt(s.folio) || 0));
        return maxFolio + 1;
    };

    // --- CATALOGS STATE ---
    const defaultCatalogs = {
        vehicleTypes: ['Sedán', 'Hatchback', 'SUV', 'Pick-up', 'Van', 'Motocicleta', 'Camión 3.5', 'Camión Rabón'],
        vehicleBrands: ['Ford', 'Chevrolet', 'Nissan', 'Toyota', 'Volkswagen', 'Honda', 'Mazda', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz'],
        colors: ['Blanco', 'Negro', 'Plata', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Café', 'Beige'],
        extraCharges: ['Maniobra Especial', 'Abanderamiento', 'Tiempo de Espera', 'Pensión', 'Custodia', 'Dollys']
    };

    const [catalogs, setCatalogs] = useState(() => {
        try {
            const saved = localStorage.getItem('towing_catalogs');
            return saved ? { ...defaultCatalogs, ...JSON.parse(saved) } : defaultCatalogs;
        } catch (error) {
            console.error("Error loading catalogs", error);
            return defaultCatalogs;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('towing_catalogs', JSON.stringify(catalogs));
        } catch (error) {
            console.error("Error saving catalogs", error);
        }
    }, [catalogs]);

    const updateCatalogs = (newCatalogs) => {
        setCatalogs(newCatalogs);
    };

    return (
        <ServiceContext.Provider value={{
            services,
            addService,
            updateService,
            fetchServices, // Exposed for manual reloads
            getServiceByFolio,
            getNextFolio,
            catalogs,
            updateCatalogs
        }}>
            {children}
        </ServiceContext.Provider>
    );
};
