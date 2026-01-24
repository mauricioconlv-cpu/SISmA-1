import React, { useState, useEffect } from 'react';
import { User, Wrench, MapPin, Save, Truck, Edit3, ArrowLeft } from 'lucide-react';
import { InputGroup, SectionTitle, StyledInput, StyledSelect, StyledTextArea } from '../../Shared/UIComponents';
import MapPicker from '../../Shared/MapPicker';
import WizardVehicle from '../WizardVehicle';
import WizardDestination from '../WizardDestination';

// Updated Step1Report - Version 2.0 (Clean Props)
const Step1Report = ({
    formData,
    setFormData,
    clients, // <--- LISTA FILTRADA DESDE SERVICE WIZARD (CONTEXTO)
    onNext,
    onBack,
    onSave,
    isLocked,
    onUnlock,
    selectedService,
    user
}) => {

    // Debug para verificar qué llega realmente
    // console.log("Step1Report v2: Clients prop:", clients);

    // Combine 'PARTICULAR' with the passed clients prop.
    const localClients = [
        { id: 'particular', name: 'PARTICULAR' },
        ...(clients || [])
    ];

    const isLoadingClients = false;

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
        const value = e.target.value;

        // Caso: PARTICULAR
        if (value === 'particular') {
            setFormData(prev => ({
                ...prev,
                clientId: null,
                cliente: 'Particular',
                folioCliente: '',
            }));
            return;
        }

        // Caso: Cliente Real
        // Buscamos por ID (comparando como string para seguridad mix number/string)
        const selectedClient = localClients.find(c => String(c.id) === value);

        if (selectedClient) {
            setFormData(prev => ({
                ...prev,
                clientId: selectedClient.id,
                cliente: selectedClient.name,
            }));
        }
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

    // Auto-select 'Particular' if it's the only option and hide the dropdown
    const singleClientMode = localClients.length === 1 && localClients[0].id === 'particular';

    useEffect(() => {
        if (singleClientMode && formData.clientId !== null) {
            // Force selection of Particular
            setFormData(prev => ({
                ...prev,
                clientId: null,
                cliente: 'Particular',
                folioCliente: ''
            }));
        }
    }, [singleClientMode, setFormData]);

    return (
        <div className="animate-fade-in space-y-8">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-4">
                <ArrowLeft size={18} /> Volver a Selección
            </button>

            {/* BLOCK 1: GENERAL INFO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <SectionTitle title="Información del Reporte" icon={<User size={20} />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Hide Client Dropdown if only Particular is available */}
                    {!singleClientMode && (
                        <InputGroup label="Cliente *" required>
                            <StyledSelect
                                name="clientId"
                                value={formData.clientId ? formData.clientId : 'particular'}
                                onChange={handleClientChange}
                                disabled={isLocked || isLoadingClients}
                            >
                                {localClients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </StyledSelect>
                        </InputGroup>
                    )}
                    <InputGroup label="Folio Cliente" required={formData.cliente !== 'Particular'}>
                        <StyledInput name="folioCliente" value={formData.folioCliente} onChange={handleChange} disabled={isLocked} />
                    </InputGroup>
                    <InputGroup label="Nombre Reporta" required={formData.cliente !== 'Particular'}>
                        <StyledInput name="nombreReporta" value={formData.nombreReporta} onChange={handleChange} disabled={isLocked} />
                    </InputGroup>
                    <InputGroup label="Nombre Asegurado">
                        <StyledInput name="nombreAsegurado" value={formData.nombreAsegurado} onChange={handleChange} disabled={isLocked} />
                    </InputGroup>
                    <InputGroup label="Teléfono Asegurado">
                        <StyledInput name="telefonoAsegurado" value={formData.telefonoAsegurado} onChange={handleChange} disabled={isLocked} />
                    </InputGroup>
                </div>
            </div>

            {/* BLOCK 2 & 3: VEHICLE & MANEUVER (Modularized) */}
            {selectedService && selectedService.category === 'vehicular' && (
                <WizardVehicle formData={formData} handleChange={handleChange} isLocked={isLocked} />
            )}

            {/* HOME/GENERAL DETAILS (Only if NOT Vehicular) */}
            {selectedService && selectedService.category !== 'vehicular' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <SectionTitle title="Detalles del Servicio" icon={<Wrench size={20} />} />
                    <InputGroup label="Descripción del Problema / Solicitud *" required>
                        <StyledTextArea
                            name="descripcionServicio"
                            value={formData.descripcionServicio}
                            onChange={handleChange}
                            placeholder="Describa detalladamente el servicio requerido (ej. fuga de agua en cocina, cambio de apagador, etc.)"
                            className="h-32"
                            disabled={isLocked}
                        />
                    </InputGroup>
                </div>
            )}

            {/* LOCATION (Always Visible) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <SectionTitle title="Ubicación del Servicio" icon={<MapPin size={20} />} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2"><InputGroup label="Calle y Número"><StyledInput name="calleOrigen" value={formData.calleOrigen} onChange={handleChange} disabled={isLocked} /></InputGroup></div>
                            <div className="col-span-2"><InputGroup label="Entre Calles"><StyledInput name="entreCallesOrigen" value={formData.entreCallesOrigen} onChange={handleChange} placeholder="ej. Entre Av. Reforma y Calle 5" disabled={isLocked} /></InputGroup></div>

                            <InputGroup label="Colonia"><StyledInput name="coloniaOrigen" value={formData.coloniaOrigen} onChange={handleChange} disabled={isLocked} /></InputGroup>
                            <InputGroup label="Municipio"><StyledInput name="municipioOrigen" value={formData.municipioOrigen} onChange={handleChange} disabled={isLocked} /></InputGroup>
                            <InputGroup label="Estado"><StyledInput name="estadoOrigen" value={formData.estadoOrigen} onChange={handleChange} disabled={isLocked} /></InputGroup>

                            <div className="col-span-2"><InputGroup label="Referencias Visuales"><StyledTextArea name="obsOrigen" value={formData.obsOrigen} onChange={handleChange} className="h-20" disabled={isLocked} /></InputGroup></div>
                        </div>
                    </div>
                    <div>
                        <MapPicker
                            onLocationSelect={(data) => handleLocationSelect('origin', data)}
                            externalCoords={
                                formData.latitudOrigen && formData.longitudOrigen &&
                                    !isNaN(parseFloat(formData.latitudOrigen)) &&
                                    !isNaN(parseFloat(formData.longitudOrigen))
                                    ? { lat: formData.latitudOrigen, lng: formData.longitudOrigen }
                                    : null
                            }
                        />
                    </div>
                </div>
            </div>

            {/* BLOCK 4: DESTINATION (Modularized) */}
            {selectedService && (selectedService.id === 'grua' || selectedService.id === 'tow') && (
                <WizardDestination
                    formData={formData}
                    handleChange={handleChange}
                    handleLocationSelect={handleLocationSelect}
                    isLocked={isLocked}
                />
            )}

            {/* ACTION BUTTONS STEP 1 */}
            <div className="flex justify-end pt-6 gap-4">
                {!isLocked && (
                    <button
                        onClick={onSave}
                        className="px-10 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 transition-all bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <Save size={20} /> Guardar Datos Iniciales
                    </button>
                )}

                {isLocked && (
                    <>
                        <button
                            onClick={() => onNext && onNext()}
                            className="px-10 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 transition-all bg-green-600 text-white hover:bg-green-700"
                        >
                            <Truck size={20} /> Continuar a Asignación
                        </button>

                        {/* VALIDACIÓN DE PERMISOS: Solo si tiene permiso can_edit_expedient o NO es ejecutivo */}
                        {(user?.role !== 'executive' || user?.permissions?.can_edit_expedient) && (
                            <button
                                onClick={onUnlock}
                                className="px-10 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 transition-all bg-amber-500 text-white hover:bg-amber-600"
                            >
                                <Edit3 size={20} /> Modificar Datos
                            </button>
                        )}
                    </>
                )}
            </div>
        </div >
    );
};

export default Step1Report;
