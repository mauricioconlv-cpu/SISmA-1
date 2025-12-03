import React from 'react';
import { Navigation } from 'lucide-react';
import MapPicker from '../Shared/MapPicker';
import { InputGroup, SectionTitle, StyledInput, StyledSelect } from '../Shared/UIComponents';

const WizardDestination = ({ formData, handleChange, handleLocationSelect, isLocked }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <SectionTitle title="Destino e Inventario" icon={<Navigation size={20} />} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <InputGroup label="¿A dónde se lleva?">
                        <StyledSelect name="tipoDestino" value={formData.tipoDestino} onChange={handleChange} readOnly={isLocked}>
                            <option value="">-- Seleccione --</option>
                            <option value="Taller">Taller Mecánico</option>
                            <option value="Agencia">Agencia Automotriz</option>
                            <option value="Domicilio">Domicilio Particular</option>
                            <option value="Corralón">Corralón</option>
                        </StyledSelect>
                    </InputGroup>

                    {formData.motivoSolicitud === 'Siniestro' && (
                        <>
                            <InputGroup label="Taller / Agencia Destino">
                                <StyledInput name="tallerDestino" value={formData.tallerDestino} onChange={handleChange} readOnly={isLocked} />
                            </InputGroup>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Persona que Recibe">
                                    <StyledInput name="personaRecibe" value={formData.personaRecibe} onChange={handleChange} readOnly={isLocked} />
                                </InputGroup>
                                <InputGroup label="No. de Vale">
                                    <StyledInput name="noVale" value={formData.noVale} onChange={handleChange} readOnly={isLocked} />
                                </InputGroup>
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Calle y Número"><StyledInput name="calleDestino" value={formData.calleDestino} onChange={handleChange} readOnly={isLocked} /></InputGroup>
                        <InputGroup label="Colonia"><StyledInput name="coloniaDestino" value={formData.coloniaDestino} onChange={handleChange} readOnly={isLocked} /></InputGroup>
                        <InputGroup label="Municipio"><StyledInput name="municipioDestino" value={formData.municipioDestino} onChange={handleChange} readOnly={isLocked} /></InputGroup>
                        <InputGroup label="Estado"><StyledInput name="estadoDestino" value={formData.estadoDestino} onChange={handleChange} readOnly={isLocked} /></InputGroup>
                    </div>
                    <InputGroup label="Entre Calles"><StyledInput name="entreCallesDestino" value={formData.entreCallesDestino} onChange={handleChange} readOnly={isLocked} /></InputGroup>
                </div>

                <div className="space-y-6">
                    <MapPicker onLocationSelect={(data) => handleLocationSelect('dest', data)} />

                    {/* INVENTARIO */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">¿Vehículo viaja bajo inventario?</label>
                        <div className="flex gap-4 mb-4">
                            <label className={`flex items-center gap-2 ${isLocked ? 'opacity-60' : 'cursor-pointer'}`}>
                                <input type="radio" name="viajaBajoInventario" value="Si" checked={formData.viajaBajoInventario === 'Si'} onChange={handleChange} disabled={isLocked} /> Si
                            </label>
                            <label className={`flex items-center gap-2 ${isLocked ? 'opacity-60' : 'cursor-pointer'}`}>
                                <input type="radio" name="viajaBajoInventario" value="No" checked={formData.viajaBajoInventario === 'No'} onChange={handleChange} disabled={isLocked} /> No
                            </label>
                        </div>

                        {formData.viajaBajoInventario === 'No' ? (
                            <InputGroup label="¿Quién acompaña el traslado?">
                                <StyledInput name="quienAcompana" value={formData.quienAcompana} onChange={handleChange} placeholder="Nombre del acompañante" readOnly={isLocked} />
                            </InputGroup>
                        ) : (
                            <InputGroup label="¿Quién recibe en destino?">
                                <StyledInput name="quienRecibe" value={formData.quienRecibe} onChange={handleChange} placeholder="Nombre de quien recibe" readOnly={isLocked} />
                            </InputGroup>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WizardDestination;
