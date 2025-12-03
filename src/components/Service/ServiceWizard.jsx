import React, { useState, useEffect } from 'react';
import { Save, MapPin, Navigation, CheckCircle, Edit3, Truck, Calendar, User, ArrowLeft, Battery, Disc, Fuel, Key, Wrench, Zap, Hammer, Pill, DollarSign } from 'lucide-react';
import MapPicker from '../Shared/MapPicker';

import { InputGroup, SectionTitle, StyledInput, StyledSelect, StyledTextArea } from '../Shared/UIComponents';
import { SERVICE_TYPES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useClients } from '../../context/ClientContext';
import { useServices } from '../../context/ServiceContext';

// Sub-components
import WizardVehicle from './WizardVehicle';
import WizardDestination from './WizardDestination';

import ServiceAuditLog from './ServiceAuditLog';
import Step1Report from './Steps/Step1Report';
import Step2Assignment from './Steps/Step2Assignment';
import Step3Monitoring from './Steps/Step3Monitoring';


// Status Constants
const SERVICE_STATUS = {
    ASIGNADO: 'Asignado',
    EN_SITIO: 'En Sitio',
    CONTACTO: 'Contacto',
    TRASLADO: 'Traslado',
    FINALIZADO: 'Finalizado'
};

const ServiceWizard = ({ user, config, onSave, nextFolio, serviceId }) => {
    const { hasPermission } = useAuth();
    const { clients } = useClients();
    const { addService, updateService, getNextFolio, getServiceByFolio } = useServices();

    // --- STATE ---
    const [step, setStep] = useState(0); // 0: Selección, 1: Datos, 2: Asignación
    const [selectedService, setSelectedService] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [isAssignmentLocked, setIsAssignmentLocked] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [folio, setFolio] = useState(nextFolio || getNextFolio());

    // Audit State
    const [previousData, setPreviousData] = useState(null); // Snapshot for diffs
    const [unlockReason, setUnlockReason] = useState('');

    useEffect(() => {
        if (nextFolio) setFolio(nextFolio);
    }, [nextFolio]);

    // Safety check: If no service selected, force step 0
    useEffect(() => {
        if (step > 0 && !selectedService) {
            setStep(0);
        }
    }, [step, selectedService]);

    // Initial Step Determination & Data Loading (Edit Mode)
    useEffect(() => {
        if (serviceId) {
            const serviceData = getServiceByFolio(serviceId);
            if (serviceData) {
                setFormData(serviceData);
                setFolio(serviceData.folio);

                // Restore Selected Service Type
                const serviceType = SERVICE_TYPES.find(s => s.id === serviceData.serviceType);
                if (serviceType) setSelectedService(serviceType);

                // Smart Resume Logic
                const s = serviceData.status ? serviceData.status.toUpperCase() : '';
                if (['ASIGNADO', 'ASIGNADA', 'EN SITIO', 'EN_SITIO', 'CONTACTO', 'TRASLADO', 'FINALIZADO'].includes(s)) {
                    setStep(3);
                    setIsLocked(true);
                    setIsAssignmentLocked(true);
                } else if (serviceData.grua && serviceData.operador) {
                    setStep(2);
                    setIsLocked(true);
                } else {
                    setStep(1);
                    setIsLocked(true);
                }
            }
        }
    }, [serviceId]); // Run when serviceId changes

    // Form Data
    const [formData, setFormData] = useState({
        // Reporte General
        cliente: '',
        clientId: null,
        folioCliente: '',
        nombreReporta: '',
        nombreAsegurado: '',
        telefonoAsegurado: '',
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        usuario: user?.nombre || '',
        descripcionServicio: '',

        // Motivo (Bifurcación)
        motivoSolicitud: '', // 'Siniestro' | 'Asistencia'

        // Vehículo
        vehiculo: '',
        marca: '',
        submarca: '',
        placas: '',
        color: '',

        // Siniestro
        descripcionDanios: '',
        fotosDanios: [],

        // Asistencia
        tipoFalla: '',
        especifiqueFalla: '',

        // Maniobra
        vehiculoEnNeutral: 'Si',
        tipoTransmision: '',
        llantasGiran: 'Si',
        volanteGira: 'Si',
        vehiculoPieCalle: 'Si',
        ubicacionDetalle: '',
        tipoGarage: '',
        nivelEstacionamiento: '',
        tipoRampa: '',
        alturaEstacionamiento: '',
        fotosManiobra: [],

        // Origen
        calleOrigen: '', coloniaOrigen: '', municipioOrigen: '', estadoOrigen: '', cpOrigen: '',
        latitudOrigen: '', longitudOrigen: '',
        entreCallesOrigen: '', obsOrigen: '',
        coordsOrigen: '',

        // Destino
        calleDestino: '', coloniaDestino: '', municipioDestino: '', estadoDestino: '', entreCallesDestino: '',
        coordsDestino: '',
        tipoDestino: '',
        tallerDestino: '',
        personaRecibe: '',
        noVale: '',

        // Inventario
        viajaBajoInventario: 'No',
        quienAcompana: '',
        quienRecibe: '',

        // Asignación
        grua: '',
        operador: '',
        tiempoArribo: '',
        kmOrigen: '',
        odometroInicial: '',
        tipoServicio: 'Local', // 'Local' | 'Foráneo'
        billableDistance: '', // Editable distance for quotation
        horaAsignacion: '',
        horaArribo: '',
        horaContacto: '',
        horaTermino: '',

        // Logística
        craneCoords: '',
        odometer: '',
        totalDistanceKm: 0,
        estimatedFinalOdometer: 0,

        // Audit
        auditLog: []
    });

    const handleAddLog = (logOrMessage) => {
        try {
            // Si currentUser no existe, usa un fallback seguro
            const userName = (user && user.nombre) ? user.nombre : "Operador";
            const now = Date.now();

            let newLogEntry;

            if (typeof logOrMessage === 'string') {
                newLogEntry = {
                    timestamp: now,
                    user: userName,
                    action: 'NOTA_MANUAL',
                    details: logOrMessage
                };
            } else {
                newLogEntry = {
                    timestamp: now,
                    user: logOrMessage.user || userName,
                    ...logOrMessage
                };
            }

            const updatedLogs = [...(formData.auditLog || []), newLogEntry];
            setFormData(prev => ({ ...prev, auditLog: updatedLogs }));
            updateService(folio, { ...formData, auditLog: updatedLogs });
        } catch (error) {
            console.error("Error seguro al agregar log:", error);
            // En el peor de los casos, no hacemos nada para evitar crash, o agregamos un log simple si es posible
            try {
                const simpleLog = { timestamp: Date.now(), user: 'Sistema', action: 'ERROR_LOG', details: 'Error al registrar evento' };
                const updatedLogs = [...(formData.auditLog || []), simpleLog];
                setFormData(prev => ({ ...prev, auditLog: updatedLogs }));
            } catch (e) {
                console.error("Fallo total en logging", e);
            }
        }
    };

    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) return alert("El archivo excede 2MB");
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({
                        ...prev,
                        [name]: [...(prev[name] || []), reader.result]
                    }));
                };
                reader.readAsDataURL(file);
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleClientChange = (e) => {
        const selectedId = parseInt(e.target.value);
        const selectedClient = clients.find(c => c.id === selectedId);

        setFormData(prev => ({
            ...prev,
            clientId: selectedId,
            cliente: selectedClient ? selectedClient.name : '',
        }));
    };

    const handleLocationSelect = (type, data) => {
        const suffix = type === 'origin' ? 'Origen' : 'Destino';
        setFormData(prev => {
            if (data.fromExternal) {
                return {
                    ...prev,
                    [`calle${suffix}`]: data.calle || '',
                    [`colonia${suffix}`]: data.colonia || '',
                    [`municipio${suffix}`]: data.municipio || '',
                    [`estado${suffix}`]: data.estado || '',
                    [`coords${suffix}`]: `${data.lat}, ${data.lng}`
                };
            }
            return {
                ...prev,
                [`calle${suffix}`]: data.calle || '',
                [`colonia${suffix}`]: data.colonia || '',
                [`municipio${suffix}`]: data.municipio || '',
                [`estado${suffix}`]: data.estado || '',
                [`latitud${suffix}`]: data.lat || '',
                [`longitud${suffix}`]: data.lng || '',
                [`coords${suffix}`]: `${data.lat}, ${data.lng}`
            };
        });
    };

    const handleServiceSelect = (service) => {
        setSelectedService(service);
        setStep(1);
        setIsLocked(false); // Ensure inputs are unlocked for new service
    };

    const generateAuditEntry = (oldData, newData, reason) => {
        if (!oldData) return null;
        const changes = [];
        Object.keys(newData).forEach(key => {
            if (key === 'auditLog' || key === 'quotation') return;
            // Skip calculated fields in the generic loop
            if (key === 'totalDistanceKm' || key === 'estimatedFinalOdometer') return;

            if (JSON.stringify(newData[key]) !== JSON.stringify(oldData[key])) {
                changes.push({
                    campo: key,
                    anterior: typeof oldData[key] === 'object' ? '...' : String(oldData[key]),
                    nuevo: typeof newData[key] === 'object' ? '...' : String(newData[key])
                });
            }
        });

        // Explicit checks for calculated logistics as requested
        if (oldData.estimatedFinalOdometer !== newData.estimatedFinalOdometer) {
            changes.push({
                campo: 'Odómetro Final Est',
                anterior: String(oldData.estimatedFinalOdometer),
                nuevo: String(newData.estimatedFinalOdometer)
            });
        }
        if (oldData.totalDistanceKm !== newData.totalDistanceKm) {
            changes.push({
                campo: 'Distancia Total Est',
                anterior: String(oldData.totalDistanceKm),
                nuevo: String(newData.totalDistanceKm)
            });
        }

        if (changes.length > 0) {
            return {
                usuario: user?.nombre || 'Sistema',
                fecha: new Date().toLocaleString(),
                accion: `Modificación: ${reason}`,
                detalles: changes
            };
        }
        return null;
    };

    const handleUnlock = () => {
        // SNAPSHOT: Capture current data before editing
        setPreviousData(JSON.parse(JSON.stringify(formData)));

        if (step === 2) {
            setIsAssignmentLocked(false);
        } else {
            setIsLocked(false);
        }
        setShowUnlockModal(false);

        // Log the unlock action immediately
        const unlockLogEntry = {
            usuario: user?.nombre || 'Sistema',
            fecha: new Date().toLocaleString(),
            accion: `Desbloqueo: ${unlockReason}`,
            detalles: []
        };

        setFormData(prev => ({
            ...prev,
            auditLog: [...prev.auditLog, unlockLogEntry]
        }));
    };

    const handleAssignment = async () => {
        // VALIDATION
        if (!formData.cliente) return alert("El cliente es obligatorio");

        const isParticular = formData.cliente === 'Particular';
        if (!isParticular) {
            if (!formData.folioCliente) return alert("El Folio Cliente es obligatorio para aseguradoras");
            if (!formData.nombreReporta) return alert("El Nombre de quien reporta es obligatorio");
        }

        if (selectedService.category === 'vehicular') {
            if (!formData.motivoSolicitud) return alert("Seleccione el motivo de solicitud (Siniestro/Asistencia)");
            if (!formData.vehiculo || !formData.placas) return alert("Vehículo y Placas son obligatorios");
        } else {
            if (!formData.descripcionServicio) return alert("La descripción del servicio es obligatoria");
        }

        // Generate Audit Log if this is an update
        let newLogEntry = generateAuditEntry(previousData, formData, unlockReason);
        const updatedAuditLog = newLogEntry ? [...formData.auditLog, newLogEntry] : formData.auditLog;

        const finalData = {
            ...formData,
            auditLog: updatedAuditLog,
            serviceType: selectedService.id,
            serviceLabel: selectedService.label,
            category: selectedService.category,
            horaAsignacion: formData.horaAsignacion || new Date().toLocaleString(),
            folio: folio,
            // REDUNDANT SAFETY: Force UUIDs here too
            clientId: formData.clientId || '00000000-0000-0000-0000-000000000000',
            companyId: formData.companyId || user?.companyId || '00000000-0000-0000-0000-000000000000',

        };

        setFormData(prev => ({
            ...prev,
            auditLog: updatedAuditLog,
            horaAsignacion: finalData.horaAsignacion
        }));

        setIsLocked(true);
        setShowUnlockModal(false);
        setPreviousData(null); // Reset snapshot

        // Move to Step 2 (Assignment)
        setStep(2);

        // SAVE TO CONTEXT (NEW OR UPDATE)
        try {
            await addService(finalData);

            // LOG: SERVICIO CAPTURADO
            handleAddLog({
                action: 'CAPTURA_DATOS',
                details: `✅ SERVICIO CAPTURADO. Folio generado: ${folio}. Capturó: ${user?.nombre || 'Sistema'}`
            });

            if (onSave) onSave(finalData);
        } catch (error) {
            console.error("Error saving service:", error);
            alert("Error al guardar el servicio. Por favor intente de nuevo.");
        }
    };

    const handleCloseService = async () => {
        const finalData = { ...formData, status: 'Cerrado' };
        setFormData(finalData);
        try {
            await updateService(folio, finalData);
            if (onSave) onSave(finalData);
            alert('✅ Expediente cerrado y archivado correctamente.');
        } catch (error) {
            console.error("Error closing service:", error);
            alert("Error al cerrar el servicio.");
        }
    };

    // --- STEPPER LOGIC ---
    const steps = [
        { id: 1, label: 'Reporte' },
        { id: 2, label: 'Asignación' },
        { id: 3, label: 'Monitoreo' }
    ];

    const handleStepClick = (stepId) => {
        // Allow going back
        if (stepId < step) {
            setStep(stepId);
            return;
        }

        // Allow going forward ONLY if current step is completed/valid
        if (stepId === 2 && step === 1) {
            if (formData.cliente) { // Basic check
                setStep(2);
            } else {
                alert("Complete la información del reporte primero.");
            }
        }

        if (stepId === 3) {
            if (formData.assignmentData || formData.assignmentTimestamp) {
                setStep(3);
            } else {
                alert("Debe confirmar la asignación antes de monitorear.");
            }
        }
    };

    // --- RENDER HELPERS ---
    const getIcon = (iconName) => {
        const icons = { Truck, Battery, Disc, Fuel, Key, Wrench, Zap, Hammer, Pill };
        const Icon = icons[iconName] || Truck;
        return <Icon size={32} />;
    };

    return (
        <div className={`max-w-7xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300`}>

            {showUnlockModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-[500px] max-w-full relative animate-fadeIn">
                        {/* Botón Cerrar (X) */}
                        <button
                            onClick={() => setShowUnlockModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        >
                            &times;
                        </button>
                        <div className="text-center mb-6">
                            <div className="bg-orange-100 text-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                🔒
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Autorización Requerida</h3>
                            <p className="text-gray-500 mt-2">
                                El servicio está protegido. Para editar, justifica la razón.
                            </p>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo del Cambio</label>
                            <select
                                className="w-full border-2 border-gray-200 rounded-lg p-3 text-gray-700 focus:border-blue-500 outline-none transition-colors"
                                value={unlockReason}
                                onChange={(e) => setUnlockReason(e.target.value)}
                            >
                                <option value="">-- Seleccione un motivo --</option>
                                <option value="Usuario cambió ubicación">Usuario cambió ubicación</option>
                                <option value="Cabina/Cliente proporcionó mal la información">Cabina/Cliente proporcionó mal la información</option>
                                <option value="A solicitud de cabina/cliente">A solicitud de cabina/cliente</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnlockModal(false)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={!unlockReason}
                                className={`flex-1 py-3 rounded-lg text-white font-bold shadow-lg transition-all ${!unlockReason ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/30'
                                    }`}
                            >
                                Desbloquear Edición
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {serviceId ? 'Editando' : 'Nuevo Servicio'}
                        </span>
                        <span className="text-slate-400 text-sm font-mono">#{folio}</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">
                        {serviceId ? `Modificando Servicio #${folio}` : (step === 1 ? 'Reporte de Servicio' : step === 2 ? 'Asignación de Unidad' : 'Monitoreo en Tiempo Real')}
                    </h2>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-blue-400">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-slate-400 text-sm font-medium">
                        {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>

            {/* STEPPER NAVIGATION */}
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
                <div className="flex items-center justify-center max-w-3xl mx-auto relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-0 transform -translate-y-1/2"></div>

                    <div className="w-full flex justify-between z-10 relative">
                        {steps.map((s) => {
                            const isActive = step === s.id;
                            const isCompleted = step > s.id;
                            // Logic for clickable:
                            // 1. Always clickable if it's a past step
                            // 2. Clickable if it's the next step AND current step is valid
                            // 3. Step 3 clickable if status is advanced
                            const isClickable = s.id < step ||
                                (s.id === 2 && step === 1 && formData.cliente) ||
                                (s.id === 3 && formData.status && ['Asignado', 'En Sitio', 'Contacto', 'Traslado', 'Finalizado'].includes(formData.status));

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => isClickable ? handleStepClick(s.id) : null}
                                    className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all duration-300
                                            ${isActive ? 'bg-blue-600 border-blue-200 text-white scale-110 shadow-lg' :
                                            isCompleted ? 'bg-green-500 border-green-200 text-white' :
                                                'bg-white border-slate-200 text-slate-400'}`}
                                    >
                                        {isCompleted ? <CheckCircle size={20} /> : s.id}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-50 min-h-[600px]">
                {/* STEP 0: SELECCIÓN DE SERVICIO */}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <SectionTitle title="¿Qué tipo de servicio desea registrar?" icon={<CheckCircle size={20} />} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {SERVICE_TYPES.filter(s => hasPermission(s.id)).map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service)}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center gap-4 group text-center"
                                >
                                    <div className="bg-blue-50 text-blue-600 p-4 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        {getIcon(service.icon)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{service.label}</h3>
                                        <p className="text-xs text-slate-400 uppercase mt-1">{service.category}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 1: DATOS DEL SERVICIO */}
                {step === 1 && (
                    <Step1Report
                        formData={formData}
                        setFormData={setFormData}
                        clients={clients}
                        onNext={() => setStep(2)}
                        onBack={() => setStep(0)}
                        onSave={handleAssignment}
                        isLocked={isLocked}
                        onUnlock={() => setShowUnlockModal(true)}
                        selectedService={selectedService}
                    />
                )}

                {/* STEP 2: ASIGNACIÓN DE UNIDAD (EXTRACTED) */}
                {step === 2 && (
                    <Step2Assignment
                        formData={formData}
                        setFormData={setFormData}
                        clients={clients}
                        config={config}
                        onConfirm={async (data) => {
                            // Update local state and context
                            const updatedData = { ...formData, ...data };
                            setFormData(updatedData);
                            try {
                                await updateService(folio, updatedData);

                                // LOG: UNIDAD ASIGNADA
                                handleAddLog({
                                    action: 'ASIGNACIÓN_UNIDAD',
                                    details: `🏗️ UNIDAD ASIGNADA. Grúa: ${data.grua || 'N/A'}. Asignó: ${user?.nombre || 'Sistema'}`
                                });

                                setStep(3);
                                alert(`✅ Servicio #${folio} Asignado Correctamente.`);
                            } catch (error) {
                                console.error("Error updating service:", error);
                                alert("Error al asignar la unidad.");
                            }
                        }}
                        onBack={() => setStep(1)}
                        onAddLog={handleAddLog}
                        isAssignmentLocked={isAssignmentLocked}
                        onUnlock={() => setShowUnlockModal(true)}
                    />
                )}

                {/* STEP 3: MONITORING DASHBOARD */}
                {step === 3 && (
                    <Step3Monitoring
                        formData={formData}
                        setFormData={setFormData}
                        onBack={() => setStep(2)}
                        onAddLog={handleAddLog}
                        onCloseService={handleCloseService}
                        user={user}
                    />
                )}

            </div>

            {/* AUDIT LOG & NOTES */}
            <div className="px-8 pb-8">
                <ServiceAuditLog logs={formData.auditLog} onAddLog={handleAddLog} user={user} />
            </div>

        </div >
    );
};


export default ServiceWizard;
