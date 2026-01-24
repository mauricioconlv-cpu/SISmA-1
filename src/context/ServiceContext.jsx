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
            // JOIN UPDATE: Bringing full objects for Client and Crane (Vehicle)
            const { data, error } = await supabase
                .from('services')
                .select('*, clients(name), vehicles(brand, plates, economic_number)')
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

            // --- VALIDACIÓN DE CLIENT_ID ---
            let validClientId = newService.client_id;

            // Ensure validClientId is not explicitly null/undefined/empty string if we want to enforce it
            // However, the ServiceWizard should have enforced it already.
            // We just ensure it's not overriding valid data.

            // NOTE: Removed legacy hardcoded CLIENTE_1 logic as per request.
            // Also removed DUMMY_UUID fallback to force real UUIDs or fail (catch invalid input type).


            // --- VALIDACIÓN CRÍTICA COMPANY_ID ---
            const validCompanyId = user?.company_id || user?.company?.id;

            if (!validCompanyId) {
                console.error("⛔ CRITICAL: Intentando guardar servicio sin company_id");
                throw new Error("Error de Integridad: No se ha detectado una empresa asignada a tu sesión. Por favor recarga la página.");
            }

            const serviceToInsert = {
                // Columnas Fijas que SÍ existen en Supabase
                folio: newService.folio || getNextFolio(),
                client_id: validClientId || newService.clientId, // Ensure fallback
                company_id: validCompanyId, // ENFORCE DATA OWNERSHIP
                status: 'Activo',
                service_type: newService.serviceType, // Ensure this is saved

                // Address Columns (Flat)
                origin_address: newService.calleOrigen,
                origin_coords: newService.coordsOrigen,
                destination_address: newService.calleDestino,
                destination_coords: newService.coordsDestino,

                // Columnas JSONB (Aquí adentro va todo lo demás)
                vehicle_data: vehicle_data || {},
                // CRITICAL FIX: Merge report data into assignment_data as requested
                assignment_data: {
                    ...(assignment_data || {}),
                    // Merged Report Data
                    nombreReporta: newService.nombreReporta,
                    telefonoReporta: newService.telefonoAsegurado,
                    folioCliente: newService.folioCliente,
                    motivoSolicitud: newService.motivoSolicitud,
                    descripcionServicio: newService.descripcionServicio,
                    tipoServicio: newService.tipoServicio
                },

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

            let validClientId = updatedData.clientId;

            // NOTE: Removed legacy hardcoded CLIENTE_1 logic.

            // 3. PREPARAR PAYLOAD LIMPIO
            // 3. PREPARAR PAYLOAD LIMPIO
            const serviceToUpdate = {
                // Campos top-level permitidos
                client_id: validClientId || updatedData.clientId, // Ensure fallback
                status: updatedData.status,
                // REMOVED: service_type from root

                // Address Columns (Flat)
                origin_address: updatedData.calleOrigen,
                origin_coords: updatedData.coordsOrigen,
                destination_address: updatedData.calleDestino,
                destination_coords: updatedData.coordsDestino,

                // JSONB columns
                vehicle_data: vehicle_data || {},
                // CRITICAL FIX: Merge report data into assignment_data on update too
                assignment_data: {
                    ...(assignment_data || {}),
                    service_type: updatedData.serviceType, // Moved here
                    // Merged Report Data
                    nombreReporta: updatedData.nombreReporta,
                    telefonoReporta: updatedData.telefonoAsegurado,
                    folioCliente: updatedData.folioCliente,
                    motivoSolicitud: updatedData.motivoSolicitud,
                    descripcionServicio: updatedData.descripcionServicio,
                    tipoServicio: updatedData.tipoServicio
                },

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
