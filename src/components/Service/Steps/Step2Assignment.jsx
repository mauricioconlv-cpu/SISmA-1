import React, { useState, useEffect, useMemo } from 'react';
import { Save, Edit3, Truck, MapPin, DollarSign, ArrowLeft } from 'lucide-react';
import { InputGroup, SectionTitle, StyledInput, StyledSelect } from '../../Shared/UIComponents';
import { DEFAULT_TARIFAS } from '../../../utils/constants';

const Step2Assignment = ({
    formData,
    setFormData,
    clients,
    config,
    onConfirm,
    onBack,
    onAddLog,
    isAssignmentLocked,
    onUnlock
}) => {
    // --- LOCAL STATE ---
    const [extrasQuantities, setExtrasQuantities] = useState({
        maniobraBase: 0, esperaHora: 0, horarioNocturno: false, pasoCorriente: 0, cambioLlanta: 0, suministroGasolina: 0, resguardoDia: 0,
        adaptacion: 0, cargaKg: 0, acondicionamiento: 0, rescate: 0, nivelSubterraneo: 0,
        dollys: 0, patines: 0, goJacks: 0
    });

    const [logistics, setLogistics] = useState({ approach: null, transfer: null });

    // --- HANDLERS ---
    const onUpdate = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        onUpdate(name, type === 'checkbox' ? checked : value);
    };

    const handleExtrasChange = (key, val) => {
        setExtrasQuantities(prev => ({ ...prev, [key]: val }));
    };

    // --- LOGISTICS CALCULATIONS ---
    const calculateLogistics = (craneCoordsStr) => {
        if (!craneCoordsStr || !window.google) return;

        const [lat, lng] = craneCoordsStr.split(',').map(c => parseFloat(c.trim()));
        if (isNaN(lat) || isNaN(lng)) return;

        const craneLocation = new window.google.maps.LatLng(lat, lng);
        const serviceOrigin = new window.google.maps.LatLng(parseFloat(formData.latitudOrigen), parseFloat(formData.longitudOrigen));
        const serviceDest = formData.latitudDestino && formData.longitudDestino
            ? new window.google.maps.LatLng(parseFloat(formData.latitudDestino), parseFloat(formData.longitudDestino))
            : null;

        const service = new window.google.maps.DistanceMatrixService();

        // 1. Approach: Crane -> Origin
        service.getDistanceMatrix({
            origins: [craneLocation],
            destinations: [serviceOrigin],
            travelMode: 'DRIVING'
        }, (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                const element = response.rows[0].elements[0];
                setLogistics(prev => ({
                    ...prev,
                    approach: {
                        distance: element.distance.text,
                        duration: element.duration.text
                    }
                }));
                // Auto-fill arrival time
                onUpdate('tiempoArribo', element.duration.text);
            }
        });

        // 2. Transfer: Origin -> Destination (if destination exists)
        if (serviceDest) {
            service.getDistanceMatrix({
                origins: [serviceOrigin],
                destinations: [serviceDest],
                travelMode: 'DRIVING'
            }, (response, status) => {
                if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                    const element = response.rows[0].elements[0];
                    setLogistics(prev => ({
                        ...prev,
                        transfer: {
                            distance: element.distance.text,
                            duration: element.duration.text
                        }
                    }));
                    // Auto-fill billable distance from maps
                    const distanceKm = parseFloat(element.distance.text.replace(/[^0-9.]/g, '')) || 0;
                    onUpdate('billableDistance', distanceKm);
                }
            });
        }
    };

    // Effect to update total distances in formData
    useEffect(() => {
        if (!logistics.approach && !logistics.transfer && !formData.odometer) return;

        const approachKm = parseFloat((logistics.approach?.distance || '0').replace(/[^0-9.]/g, '')) || 0;
        const transferKm = parseFloat((logistics.transfer?.distance || '0').replace(/[^0-9.]/g, '')) || 0;
        const currentOdometer = parseFloat(formData.odometer) || 0;

        const totalKm = parseFloat((approachKm + transferKm).toFixed(1));
        const finalOdometer = parseFloat((currentOdometer + totalKm).toFixed(1));

        // Only update if values changed to avoid infinite loop
        if (totalKm !== formData.totalDistanceKm || finalOdometer !== formData.estimatedFinalOdometer) {
            setFormData(prev => ({
                ...prev,
                totalDistanceKm: totalKm,
                estimatedFinalOdometer: finalOdometer
            }));
        }
    }, [logistics, formData.odometer, formData.totalDistanceKm, formData.estimatedFinalOdometer, setFormData]);


    // --- QUOTATION LOGIC ---
    // --- QUOTATION LOGIC ---
    const quotation = useMemo(() => {
        let matrix = {};
        const client = formData.clientId ? clients.find(c => c.id === formData.clientId) : null;

        // 1. Try to find specific tariff for this service type
        // serviceType comes from formData (which gets it from selectedService.id)
        // PRIORITY: Check if user selected a specific tariff type (e.g. 'arrastre_a')
        const sType = formData.tariffType || formData.serviceType || 'tow';

        if (client && client.tariffs && client.tariffs[sType]) {
            matrix = client.tariffs[sType].pricing_matrix || {};
        } else if (client && client.rates && !formData.tariffType) { // Fallback only if no specific tariff selected
            // Legacy Fallback
            matrix = {
                banderazo: client.rates.banderazo,
                km_rate: client.rates.tarifaKm,
                local_zone1: client.rates.tarifaLocal,
                // Map legacy extras if they match keys
                horario_nocturno: client.rates.horarioNocturno
            };
        } else {
            // Default Fallback
            matrix = {
                banderazo: DEFAULT_TARIFAS.banderazo,
                km_rate: DEFAULT_TARIFAS.costoKm,
                local_zone1: DEFAULT_TARIFAS.banderazo
            };
        }

        let subtotal = 0;
        let extras = 0;
        const breakdown = [];

        // 1. Base Cost
        if (formData.tipoServicio === 'Local') {
            // Default to Zone 1 for now, or use logic to determine zone
            subtotal = parseFloat(matrix.local_zone1) || 0;
            breakdown.push({ concept: 'Servicio Local (Zona 1)', amount: subtotal });
        } else {
            // Foráneo
            const distanceKm = parseFloat(formData.billableDistance) || 0;
            const banderazo = parseFloat(matrix.banderazo) || 0;
            const kmRate = parseFloat(matrix.km_rate) || 0;

            const kmCost = distanceKm * kmRate;
            subtotal = banderazo + kmCost;

            breakdown.push({ concept: 'Banderazo Foráneo', amount: banderazo });
            breakdown.push({ concept: `Kilometraje (${distanceKm} km x $${kmRate})`, amount: kmCost });
        }

        // 2. Extras (Iterate over our local quantities state)
        // Keys in extrasQuantities match keys in pricing_matrix (mostly)
        // We map them explicitly to ensure safety
        const EXTRA_KEYS = [
            'maniobra_base', 'hora_espera', 'paso_corriente', 'cambio_llanta',
            'suministro_gasolina', 'resguardo_dia', 'adaptacion', 'carga_kg',
            'acondicionamiento', 'rescate', 'nivel_subterraneo', 'dollys', 'patines', 'go_jacks', 'abanderamiento'
        ];

        // Normal Extras
        EXTRA_KEYS.forEach(key => {
            // Handle camelCase vs snake_case mapping if needed (state uses camelCase or specific mix)
            // step2 state: 'maniobraBase' (camel) vs matrix 'maniobra_base' (snake)
            // Let's normalize lookup
            const stateKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase()); // snack_case to camelCase
            const qty = extrasQuantities[stateKey] || 0;
            const unitPrice = parseFloat(matrix[key] || matrix[stateKey]) || 0;

            if (qty > 0 && unitPrice > 0) {
                const cost = qty * unitPrice;
                extras += cost;
                breakdown.push({ concept: `${key.replace(/_/g, ' ')} (x${qty})`, amount: cost });
            }
        });

        // Special: Horario Nocturno (Percent)
        if (extrasQuantities.horarioNocturno) { // user toggle
            // Matrix might store it as 'horario_nocturno' or 'horarioNocturno'
            // And value might be percentage (e.g. 50 for 50%)
            const pct = parseFloat(matrix.horario_nocturno || matrix.horarioNocturno) || 0;
            if (pct > 0) {
                const surcharge = subtotal * (pct / 100);
                extras += surcharge;
                breakdown.push({ concept: `Horario Nocturno (+${pct}%)`, amount: surcharge });
            }
        }

        // Armor (Blindajes) logic? (Not in Step 2 inputs yet, but ready for future)

        // Fuel Cost (Litros) if applicable
        if (sType === 'gas') {
            // Assuming we might add inputs for fuel liters later
        }

        return {
            subtotal,
            extras,
            total: subtotal + extras,
            breakdown
        };
    }, [formData.clientId, formData.tipoServicio, formData.serviceType, formData.billableDistance, extrasQuantities, clients]);

    // Update formData with quotation when it changes
    useEffect(() => {
        if (!isAssignmentLocked) {
            setFormData(prev => ({ ...prev, quotation }));
        }
    }, [quotation, isAssignmentLocked, setFormData]);


    // --- CONFIRMATION ---
    const handleFinalAssignment = () => {
        if (!formData.grua) return alert("Seleccione una grúa");
        if (!formData.operador) return alert("Seleccione un operador");

        // Parse duration to calculate ETA
        const parseDuration = (str) => {
            if (!str) return 0;
            let totalMins = 0;
            const hours = str.match(/(\d+)\s*(?:h|hour|hora)/i);
            const mins = str.match(/(\d+)\s*(?:m|min)/i);
            if (hours) totalMins += parseInt(hours[1]) * 60;
            if (mins) totalMins += parseInt(mins[1]);
            return totalMins || 0;
        };

        const durationMins = parseDuration(formData.tiempoArribo);
        const now = new Date();
        const eta = new Date(now.getTime() + durationMins * 60000);

        const assignmentData = {
            status: 'Asignado',
            horaAsignacion: formData.horaAsignacion || now.toLocaleString(),
            assignmentTimestamp: formData.assignmentTimestamp || now.getTime(),
            etaTimestamp: formData.etaTimestamp || eta.getTime(),
        };

        // Notify Parent
        onConfirm(assignmentData);
        onAddLog({
            timestamp: Date.now(),
            user: 'Sistema', // Or pass user prop
            action: 'ASIGNACION_CONFIRMADA',
            details: `Unidad ${formData.grua} asignada a ${formData.operador}. ETA: ${eta.toLocaleTimeString()}`
        });
    };

    // --- DATA PREPARATION FOR RENDER ---
    const activeMatrix = useMemo(() => {
        if (!formData.clientId) return {};
        const client = clients.find(c => c.id === formData.clientId);
        // Priority to specific tariff type
        const sType = formData.tariffType || formData.serviceType || 'tow';

        if (client && client.tariffs && client.tariffs[sType]) {
            return client.tariffs[sType].pricing_matrix || {};
        }
        // Legacy/Default Fallback
        return client?.rates || DEFAULT_TARIFAS;
    }, [formData.clientId, formData.serviceType, formData.tariffType, clients]);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold">
                    <ArrowLeft size={18} /> Volver al Reporte
                </button>
                <h2 className="text-2xl font-bold text-slate-800">Asignación de Unidad</h2>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <SectionTitle title="Detalles de Asignación" icon={<Truck size={20} />} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <InputGroup label="Unidad Asignada">
                            <StyledSelect name="grua" value={formData.grua} onChange={handleChange} readOnly={isAssignmentLocked}>
                                <option value="">-- Seleccione --</option>
                                {config && config.gruas ? (
                                    config.gruas.map(g => <option key={g} value={g}>{g}</option>)
                                ) : (
                                    <option disabled>Cargando unidades...</option>
                                )}
                            </StyledSelect>
                        </InputGroup>
                        <InputGroup label="Técnico / Operador">
                            <StyledSelect name="operador" value={formData.operador} onChange={handleChange} readOnly={isAssignmentLocked}>
                                <option value="">-- Seleccione --</option>
                                {config && config.operadores ? (
                                    config.operadores.map(o => <option key={o} value={o}>{o}</option>)
                                ) : (
                                    <option disabled>Cargando operadores...</option>
                                )}
                            </StyledSelect>
                        </InputGroup>

                        {/* TARIFF TYPE SELECTOR (Only if service supports subtypes like 'tow') */}
                        {(formData.serviceType === 'tow' || !formData.serviceType) && (
                            <div className={`p-4 rounded-xl border-2 ${isAssignmentLocked ? 'border-slate-100 bg-slate-50' : 'border-indigo-100 bg-indigo-50'}`}>
                                <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2 flex items-center gap-2">
                                    <DollarSign size={14} /> Selecciona Tarifa Aplicable
                                </h4>
                                <StyledSelect
                                    name="tariffType"
                                    value={formData.tariffType || ''}
                                    onChange={handleChange}
                                    readOnly={isAssignmentLocked}
                                    className="bg-white border-indigo-200 focus:border-indigo-500 text-indigo-900 font-bold"
                                >
                                    <option value="">-- Usar Tarifa Genérica --</option>
                                    <option value="arrastre_a">Grúa Tipo A (Compactos)</option>
                                    <option value="arrastre_b">Grúa Tipo B (Pickups/Van)</option>
                                    <option value="arrastre_c">Grúa Tipo C (3.5 Tons)</option>
                                    <option value="arrastre_d">Grúa Tipo D (Camiones)</option>
                                    <option value="tow">Grúa General (Legacy)</option>
                                </StyledSelect>
                            </div>
                        )}


                        {/* Tipo de Servicio Selector */}
                        <InputGroup label="Tipo de Servicio">
                            <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className={`flex items-center gap-2 cursor-pointer ${isAssignmentLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="radio"
                                        name="tipoServicio"
                                        value="Local"
                                        checked={formData.tipoServicio === 'Local'}
                                        onChange={handleChange}
                                        disabled={isAssignmentLocked}
                                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">Servicio Local</span>
                                </label>
                                <label className={`flex items-center gap-2 cursor-pointer ${isAssignmentLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="radio"
                                        name="tipoServicio"
                                        value="Foráneo"
                                        checked={formData.tipoServicio === 'Foráneo'}
                                        onChange={handleChange}
                                        disabled={isAssignmentLocked}
                                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-slate-700">Servicio Foráneo</span>
                                </label>
                            </div>
                        </InputGroup>

                        {/* Nuevos Campos Logísticos */}
                        <InputGroup label="Coordenadas Grúa (Lat, Lng)">
                            <StyledInput
                                name="craneCoords"
                                value={formData.craneCoords}
                                onChange={handleChange}
                                onBlur={(e) => calculateLogistics(e.target.value)}
                                placeholder="ej. 19.4326, -99.1332"
                                readOnly={isAssignmentLocked}
                            />
                        </InputGroup>
                        <InputGroup label="Odómetro Actual">
                            <div className="space-y-2">
                                <StyledInput
                                    name="odometer"
                                    value={formData.odometer}
                                    onChange={handleChange}
                                    placeholder="ej. 12500"
                                    type="number"
                                    readOnly={isAssignmentLocked}
                                />
                                {formData.odometer && (logistics.approach || logistics.transfer) && (
                                    <div className="text-xs text-slate-500 font-medium text-right">
                                        Previsto al finalizar: <span className="font-bold text-slate-800">
                                            {formData.estimatedFinalOdometer} km
                                        </span>
                                    </div>
                                )}
                            </div>
                        </InputGroup>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <InputGroup label="Tiempo Estimado Arribo">
                                <StyledInput name="tiempoArribo" value={formData.tiempoArribo} onChange={handleChange} placeholder="ej. 45 min" readOnly={isAssignmentLocked} />
                            </InputGroup>
                        </div>

                        {/* Resumen Logístico */}
                        {(logistics.approach || logistics.transfer) && (
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                                    <MapPin size={18} /> Resumen Logístico
                                </h4>
                                <div className="space-y-3 text-sm">
                                    {logistics.approach && (
                                        <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                            <span className="text-slate-600">Aproximación:</span>
                                            <span className="font-bold text-slate-800">
                                                {logistics.approach.distance} ({logistics.approach.duration})
                                            </span>
                                        </div>
                                    )}
                                    {logistics.transfer && (
                                        <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                            <span className="text-slate-600">Traslado Servicio:</span>
                                            <span className="font-bold text-slate-800">
                                                {logistics.transfer.distance}
                                            </span>
                                        </div>
                                    )}
                                    {(logistics.approach || logistics.transfer) && (
                                        <div className="flex justify-between items-center bg-blue-100 p-3 rounded-lg shadow-sm border border-blue-200 mt-2">
                                            <span className="text-blue-800 font-bold">Recorrido Total Estimado:</span>
                                            <span className="font-black text-blue-900 text-lg">
                                                {formData.totalDistanceKm} km
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COTIZACIÓN ESTIMADA */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <SectionTitle title="Cotización Estimada" icon={<DollarSign size={20} />} />

                        {/* BASE COST SECTION */}
                        <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-100 pb-1">Costo Base</h4>
                            {formData.clientId && (
                                <>
                                    {formData.tipoServicio === 'Local' ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-700">Tarifa Local (Zona 1)</span>
                                            <span className="font-bold text-slate-800">${parseFloat(activeMatrix.local_zone1 || activeMatrix.tarifaLocal || 0).toFixed(2)}</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600">Banderazo de Salida</span>
                                                <span className="font-bold text-slate-800">${parseFloat(activeMatrix.banderazo || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cantidad Kms</label>
                                                    <input
                                                        type="number"
                                                        value={formData.billableDistance}
                                                        onChange={e => onUpdate('billableDistance', e.target.value)}
                                                        disabled={isAssignmentLocked}
                                                        className="w-full p-2 border border-slate-300 rounded text-right font-bold"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="pt-5 text-slate-400">x</div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Precio x Km</label>
                                                    <div className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-right font-bold text-slate-600">
                                                        ${parseFloat(activeMatrix.km_rate || activeMatrix.tarifaKm || 0).toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="pt-5 text-slate-400">=</div>
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Subtotal Kms</label>
                                                    <div className="w-full p-2 bg-slate-100 border border-slate-200 rounded text-right font-bold text-blue-600">
                                                        ${(parseFloat(formData.billableDistance || 0) * parseFloat(activeMatrix.km_rate || activeMatrix.tarifaKm || 0)).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* EXTRAS SECTION */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-100 pb-1">Cargos Adicionales</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {formData.clientId && (
                                    <>
                                        {/* HORARIO NOCTURNO */}
                                        {(activeMatrix.horario_nocturno > 0 || activeMatrix.horarioNocturno > 0) && (
                                            <label className="flex items-center justify-between bg-white p-3 rounded border border-slate-200 cursor-pointer hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={extrasQuantities.horarioNocturno}
                                                        onChange={e => handleExtrasChange('horarioNocturno', e.target.checked)}
                                                        disabled={isAssignmentLocked}
                                                        className="w-5 h-5 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm font-bold text-slate-700">Horario Nocturno (+{activeMatrix.horario_nocturno || activeMatrix.horarioNocturno}%)</span>
                                                </div>
                                                <span className="font-bold text-blue-600">
                                                    {extrasQuantities.horarioNocturno ? `+${(activeMatrix.horario_nocturno || activeMatrix.horarioNocturno)}%` : '$0.00'}
                                                </span>
                                            </label>
                                        )}

                                        {/* DYNAMIC EXTRAS LIST */}
                                        {[
                                            { key: 'maniobra_base', label: 'Maniobra de Salvamento', stateKey: 'maniobraBase' },
                                            { key: 'hora_espera', label: 'Hora de Espera', stateKey: 'esperaHora' },
                                            { key: 'paso_corriente', label: 'Paso de Corriente', stateKey: 'pasoCorriente' },
                                            { key: 'cambio_llanta', label: 'Cambio de Llanta', stateKey: 'cambioLlanta' },
                                            { key: 'suministro_gasolina', label: 'Suministro Gasolina', stateKey: 'suministroGasolina' },
                                            { key: 'resguardo_dia', label: 'Resguardo (Día)', stateKey: 'resguardoDia' },
                                            { key: 'dollys', label: 'Uso de Dollys', stateKey: 'dollys' },
                                            { key: 'patines', label: 'Uso de Patines', stateKey: 'patines' },
                                            { key: 'go_jacks', label: 'Uso de Go-Jacks', stateKey: 'goJacks' },
                                            { key: 'abanderamiento', label: 'Abanderamiento', stateKey: 'abanderamiento' },
                                            { key: 'nivel_subterraneo', label: 'Nivel Subterráneo', stateKey: 'nivelSubterraneo' }
                                        ].map(extra => {
                                            const price = parseFloat(activeMatrix[extra.key] || activeMatrix[extra.stateKey]) || 0;
                                            if (price <= 0) return null; // Don't show if not priced

                                            return (
                                                <div key={extra.key} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                                                    <span className="text-sm text-slate-600 flex-1">{extra.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-slate-50 rounded border border-slate-300 overflow-hidden">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={extrasQuantities[extra.stateKey]}
                                                                onChange={e => handleExtrasChange(extra.stateKey, parseInt(e.target.value) || 0)}
                                                                disabled={isAssignmentLocked}
                                                                className="w-16 p-1 text-center font-bold outline-none bg-transparent"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-400">x ${price}</span>
                                                        <span className="w-20 text-right font-bold text-slate-800">
                                                            ${(extrasQuantities[extra.stateKey] * price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal (Base):</span>
                                <span>${quotation.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Extras:</span>
                                <span>${quotation.extras.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-slate-800 pt-2 border-t border-slate-200">
                                <span>Total Estimado:</span>
                                <span className="text-green-600">${quotation.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-8 mt-4 border-t border-slate-100">
                    {!isAssignmentLocked ? (
                        <button
                            onClick={handleFinalAssignment}
                            className="px-12 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 transition-all bg-green-600 text-white hover:bg-green-700"
                        >
                            <Save size={20} /> Confirmar Asignación
                        </button>
                    ) : (
                        <button
                            onClick={onUnlock}
                            className="px-12 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 transition-all bg-amber-500 text-white hover:bg-amber-600"
                        >
                            <Edit3 size={20} /> Modificar Asignación
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Step2Assignment;
