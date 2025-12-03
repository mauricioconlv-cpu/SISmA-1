import React from 'react';
import { Truck, Hammer } from 'lucide-react';
import { InputGroup, SectionTitle, StyledInput, StyledSelect, StyledTextArea } from '../Shared/UIComponents';
import { COLORES, MARCAS_MX } from '../../utils/constants';

const WizardVehicle = ({ formData, handleChange, isLocked }) => {
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <SectionTitle title="Datos del Vehículo y Siniestro" icon={<Truck size={20} />} />

                {/* MOTIVO SOLICITUD */}
                <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">¿Motivo de Solicitud? *</label>
                    <div className="flex gap-6">
                        <label className={`flex items-center gap-2 ${isLocked ? 'opacity-60' : 'cursor-pointer'}`}>
                            <input type="radio" name="motivoSolicitud" value="Siniestro" checked={formData.motivoSolicitud === 'Siniestro'} onChange={handleChange} disabled={isLocked} className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Siniestro</span>
                        </label>
                        <label className={`flex items-center gap-2 ${isLocked ? 'opacity-60' : 'cursor-pointer'}`}>
                            <input type="radio" name="motivoSolicitud" value="Asistencia" checked={formData.motivoSolicitud === 'Asistencia'} onChange={handleChange} disabled={isLocked} className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Asistencia</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <InputGroup label="Vehículo *" required>
                        <StyledInput name="vehiculo" value={formData.vehiculo} onChange={handleChange} readOnly={isLocked} />
                    </InputGroup>
                    <InputGroup label="Marca">
                        <StyledSelect name="marca" value={formData.marca} onChange={handleChange} readOnly={isLocked}>
                            <option value="">-- Seleccione --</option>
                            {MARCAS_MX.map(m => <option key={m} value={m}>{m}</option>)}
                        </StyledSelect>
                    </InputGroup>
                    <InputGroup label="Placas *" required>
                        <StyledInput name="placas" value={formData.placas} onChange={handleChange} readOnly={isLocked} className="bg-yellow-50 font-bold" />
                    </InputGroup>
                    <InputGroup label="Color">
                        <StyledSelect name="color" value={formData.color} onChange={handleChange} readOnly={isLocked}>
                            <option value="">-- Seleccione --</option>
                            {COLORES.map(c => <option key={c} value={c}>{c}</option>)}
                        </StyledSelect>
                    </InputGroup>
                </div>

                {/* CONDITIONAL FIELDS BASED ON MOTIVO */}
                {formData.motivoSolicitud === 'Siniestro' && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 animate-fade-in">
                        <h4 className="font-bold text-red-800 mb-3">Detalles del Siniestro</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="¿Cuáles son los daños?">
                                <StyledTextArea name="descripcionDanios" value={formData.descripcionDanios} onChange={handleChange} readOnly={isLocked} className="h-20" />
                            </InputGroup>
                            <InputGroup label="Fotos del Siniestro (Max 2MB)">
                                <input type="file" name="fotosDanios" accept="image/png, image/jpeg" onChange={handleChange} disabled={isLocked} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed" />
                                <div className="flex gap-2 mt-2 overflow-x-auto">
                                    {formData.fotosDanios && formData.fotosDanios.map((src, idx) => (
                                        <img key={idx} src={src} alt="Daño" className="h-16 w-16 object-cover rounded border border-slate-300" />
                                    ))}
                                </div>
                            </InputGroup>
                        </div>
                    </div>
                )}

                {formData.motivoSolicitud === 'Asistencia' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-fade-in">
                        <h4 className="font-bold text-blue-800 mb-3">Detalles de Asistencia</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Tipo de Falla">
                                <StyledSelect name="tipoFalla" value={formData.tipoFalla} onChange={handleChange} readOnly={isLocked}>
                                    <option value="">-- Seleccione --</option>
                                    <option value="Mecánica">Mecánica</option>
                                    <option value="Eléctrica">Eléctrica</option>
                                    <option value="Neumáticos">Neumáticos</option>
                                    <option value="Cerrajería">Cerrajería</option>
                                </StyledSelect>
                            </InputGroup>
                            {formData.tipoFalla && (
                                <InputGroup label="Especifique Falla">
                                    <StyledInput name="especifiqueFalla" value={formData.especifiqueFalla} onChange={handleChange} readOnly={isLocked} />
                                </InputGroup>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* BLOCK 3: MANIOBRA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
                <SectionTitle title="Condiciones de Maniobra" icon={<Hammer size={20} />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* NEUTRAL */}
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <label className="block text-sm font-bold text-slate-700 mb-2">¿Vehículo en Neutral?</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2"><input type="radio" name="vehiculoEnNeutral" value="Si" checked={formData.vehiculoEnNeutral === 'Si'} onChange={handleChange} disabled={isLocked} /> Si</label>
                            <label className="flex items-center gap-2"><input type="radio" name="vehiculoEnNeutral" value="No" checked={formData.vehiculoEnNeutral === 'No'} onChange={handleChange} disabled={isLocked} /> No</label>
                        </div>
                        {formData.vehiculoEnNeutral === 'No' && (
                            <div className="mt-2 animate-fade-in">
                                <InputGroup label="Tipo de Transmisión">
                                    <StyledSelect name="tipoTransmision" value={formData.tipoTransmision} onChange={handleChange} readOnly={isLocked}>
                                        <option value="">-- Seleccione --</option>
                                        <option value="Estándar">Estándar</option>
                                        <option value="Automático">Automático</option>
                                        <option value="Híbrido/Eléctrico">Híbrido/Eléctrico</option>
                                    </StyledSelect>
                                </InputGroup>
                            </div>
                        )}
                    </div>

                    {/* LLANTAS */}
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <label className="block text-sm font-bold text-slate-700 mb-2">¿Llantas Giran?</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2"><input type="radio" name="llantasGiran" value="Si" checked={formData.llantasGiran === 'Si'} onChange={handleChange} disabled={isLocked} /> Si</label>
                            <label className="flex items-center gap-2"><input type="radio" name="llantasGiran" value="No" checked={formData.llantasGiran === 'No'} onChange={handleChange} disabled={isLocked} /> No</label>
                        </div>
                        {formData.llantasGiran === 'No' && (
                            <div className="mt-2 animate-fade-in">
                                <label className="block text-sm font-bold text-slate-700 mb-2">¿Volante Gira?</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" name="volanteGira" value="Si" checked={formData.volanteGira === 'Si'} onChange={handleChange} disabled={isLocked} /> Si</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="volanteGira" value="No" checked={formData.volanteGira === 'No'} onChange={handleChange} disabled={isLocked} /> No</label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* UBICACIÓN */}
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <label className="block text-sm font-bold text-slate-700 mb-2">¿Vehículo a pie de calle?</label>
                        <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-2"><input type="radio" name="vehiculoPieCalle" value="Si" checked={formData.vehiculoPieCalle === 'Si'} onChange={handleChange} disabled={isLocked} /> Si</label>
                            <label className="flex items-center gap-2"><input type="radio" name="vehiculoPieCalle" value="No" checked={formData.vehiculoPieCalle === 'No'} onChange={handleChange} disabled={isLocked} /> No</label>
                        </div>
                        {formData.vehiculoPieCalle === 'No' && (
                            <div className="mt-2 animate-fade-in space-y-3">
                                <InputGroup label="¿Dónde está?">
                                    <StyledSelect name="ubicacionDetalle" value={formData.ubicacionDetalle} onChange={handleChange} readOnly={isLocked}>
                                        <option value="">-- Seleccione --</option>
                                        <option value="Garage">Garage de Casa</option>
                                        <option value="Estacionamiento">Estacionamiento Público/Plaza</option>
                                    </StyledSelect>
                                </InputGroup>

                                {formData.ubicacionDetalle === 'Garage' && (
                                    <InputGroup label="Tipo de Garage">
                                        <StyledSelect name="tipoGarage" value={formData.tipoGarage} onChange={handleChange} readOnly={isLocked}>
                                            <option value="">-- Seleccione --</option>
                                            <option value="Techado">Techado</option>
                                            <option value="Aire Libre">Aire Libre</option>
                                            <option value="Sótano">Sótano</option>
                                        </StyledSelect>
                                    </InputGroup>
                                )}

                                {formData.ubicacionDetalle === 'Estacionamiento' && (
                                    <div className="space-y-2">
                                        <InputGroup label="Nivel">
                                            <StyledSelect name="nivelEstacionamiento" value={formData.nivelEstacionamiento} onChange={handleChange} readOnly={isLocked}>
                                                <option value="">-- Nivel --</option>
                                                {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                            </StyledSelect>
                                        </InputGroup>
                                        <InputGroup label="Tipo Rampa">
                                            <StyledSelect name="tipoRampa" value={formData.tipoRampa} onChange={handleChange} readOnly={isLocked}>
                                                <option value="">-- Seleccione --</option>
                                                <option value="Recta">Recta</option>
                                                <option value="Zig Zag">Zig Zag</option>
                                                <option value="Caracol">Caracol</option>
                                            </StyledSelect>
                                        </InputGroup>
                                        <InputGroup label="Altura Aprox (mts)">
                                            <StyledInput name="alturaEstacionamiento" value={formData.alturaEstacionamiento} onChange={handleChange} placeholder="ej. 2.10" readOnly={isLocked} />
                                        </InputGroup>
                                        <InputGroup label="Foto Referencia">
                                            <input type="file" name="fotosManiobra" accept="image/*" onChange={handleChange} disabled={isLocked} className="text-xs disabled:opacity-50" />
                                        </InputGroup>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default WizardVehicle;
