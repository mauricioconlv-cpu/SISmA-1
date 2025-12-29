import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, MapPin, Mail, DollarSign, Upload, Building } from 'lucide-react';
import { SectionTitle, StyledInput } from '../Shared/UIComponents';
import { useClients } from '../../context/ClientContext';
import { useAuth } from '../../context/AuthContext';

const ClientManagement = ({ onManageTariffs }) => {
    const { user } = useAuth();
    const { clients, addClient, updateClient, deleteClient } = useClients();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);

    const canEditFinancials = ['owner', 'superadmin'].includes(user?.role);
    // Fallback: If no user load yet, assume strict.


    // Form State
    const [formData, setFormData] = useState({
        name: '',
        rfc: '',
        address: '',
        email: '',
        logo: null,
        rates: {
            // Básicos
            tarifaLocal: 0, tarifaKm: 0, banderazo: 0,
            // Extras
            maniobraBase: 0, esperaHora: 0, horarioNocturno: 0, pasoCorriente: 0, cambioLlanta: 0, suministroGasolina: 0, resguardoDia: 0,
            // Especiales
            adaptacion: 0, cargaKg: 0, acondicionamiento: 0, rescate: 0, nivelSubterraneo: 0,
            // Equipo
            dollys: 0, patines: 0, goJacks: 0
        }
    });

    const handleOpenModal = (clientToEdit = null) => {
        if (clientToEdit) {
            setCurrentClient(clientToEdit);
            setFormData({
                name: clientToEdit.name,
                rfc: clientToEdit.rfc || '',
                address: clientToEdit.address || '',
                email: clientToEdit.email || '',
                logo: clientToEdit.logo,
                rates: {
                    tarifaLocal: 0, tarifaKm: 0, banderazo: 0,
                    maniobraBase: 0, esperaHora: 0, horarioNocturno: 0, pasoCorriente: 0, cambioLlanta: 0, suministroGasolina: 0, resguardoDia: 0,
                    adaptacion: 0, cargaKg: 0, acondicionamiento: 0, rescate: 0, nivelSubterraneo: 0,
                    dollys: 0, patines: 0, goJacks: 0,
                    ...(clientToEdit.rates || {})
                }
            });
        } else {
            setCurrentClient(null);
            setFormData({
                name: '',
                rfc: '',
                address: '',
                email: '',
                logo: null,
                rates: {
                    tarifaLocal: 0, tarifaKm: 0, banderazo: 0,
                    maniobraBase: 0, esperaHora: 0, horarioNocturno: 0, pasoCorriente: 0, cambioLlanta: 0, suministroGasolina: 0, resguardoDia: 0,
                    adaptacion: 0, cargaKg: 0, acondicionamiento: 0, rescate: 0, nivelSubterraneo: 0,
                    dollys: 0, patines: 0, goJacks: 0
                }
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveClient = () => {
        if (!formData.name) return alert("El Nombre del Cliente es obligatorio");

        if (currentClient) {
            updateClient(currentClient.id, formData);
        } else {
            addClient(formData);
        }
        setIsModalOpen(false);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRateChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            rates: {
                ...prev.rates,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestión de Clientes</h1>
                    <p className="text-slate-500">Administra tu cartera de clientes y sus tarifas pactadas.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={20} /> Nuevo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                            {client.logo ? (
                                <img src={client.logo} alt={client.name} className="h-full w-full object-cover" />
                            ) : (
                                <Building size={48} className="text-slate-300" />
                            )}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => handleOpenModal(client)} className="bg-white p-2 rounded-full shadow text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                                {canEditFinancials && (
                                    <button onClick={() => deleteClient(client.id)} className="bg-white p-2 rounded-full shadow text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{client.name}</h3>
                            <div className="space-y-2 text-sm text-slate-500 mb-4">
                                <p className="flex items-center gap-2"><MapPin size={14} /> {client.address || 'Sin dirección'}</p>
                                <p className="flex items-center gap-2"><Mail size={14} /> {client.contact_info || client.email || 'Sin contacto'}</p>
                            </div>
                            {/* Rates Section Hidden for Phase 1 */}
                            {/* <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Tarifa Local</span>
                                <span className="font-bold text-green-600">${client.rates?.tarifaLocal || 0}</span>
                            </div> */}

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onManageTariffs(client.id); }}
                                    className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <DollarSign size={16} /> Gestionar Tarifas
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-xl font-bold text-slate-800">{currentClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Logo del Cliente</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative h-48">
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {formData.logo ? (
                                            <img src={formData.logo} alt="Preview" className="h-28 object-contain mb-2" />
                                        ) : (
                                            <Upload size={32} className="text-slate-400 mb-2" />
                                        )}
                                        <p className="text-sm text-slate-500">{formData.logo ? 'Cambiar Logo' : 'Subir Logo'}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre / Razón Social *</label>
                                        <StyledInput value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Aseguradora XYZ" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">RFC</label>
                                        <StyledInput value={formData.rfc} onChange={e => setFormData({ ...formData, rfc: e.target.value })} placeholder="RFC del Cliente" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dirección</label>
                                            <StyledInput value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Dirección Fiscal" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                                            <StyledInput value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contacto@cliente.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-slate-100 pt-6">
                                <SectionTitle title="Tabulador de Tarifas" icon={<DollarSign size={18} />} />
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 text-center">
                                    <p className="text-yellow-800 font-bold">⚠️ Configuración de Tarifas</p>
                                    <p className="text-sm text-yellow-700">Se habilitará en el siguiente paso. Por ahora registre solo los datos generales.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
                            {canEditFinancials && (
                                <button onClick={handleSaveClient} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Guardar Cliente</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagement;
