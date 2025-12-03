import React, { useState } from 'react';
import { Building, Plus, Edit2, Trash2, CheckSquare, Square, Shield, Upload, MapPin, Mail, FileText, DollarSign } from 'lucide-react';
import { SERVICE_TYPES } from '../../utils/constants';
import { SectionTitle, StyledInput, StyledSelect } from '../Shared/UIComponents';
import { useCompanies } from '../../context/CompanyContext';

const CompanyManagement = () => {
    const { companies, addCompany, updateCompany, deleteCompany } = useCompanies();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCompany, setCurrentCompany] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        rfc: '',
        address: '',
        email: '',
        logo: null,

        logo: null,
        modules: []
    });

    const handleOpenModal = (companyToEdit = null) => {
        if (companyToEdit) {
            setCurrentCompany(companyToEdit);
            setFormData({
                name: companyToEdit.name,
                rfc: companyToEdit.rfc || '',
                address: companyToEdit.address || '',
                email: companyToEdit.email || '',
                logo: companyToEdit.logo,
                modules: companyToEdit.modules || []
            });
        } else {
            setCurrentCompany(null);
            setFormData({
                name: '',
                rfc: '',
                address: '',
                email: '',
                logo: null,
                modules: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveCompany = () => {
        if (!formData.name) return alert("El Nombre Comercial es obligatorio");

        if (currentCompany) {
            updateCompany(currentCompany.id, formData);
        } else {
            addCompany(formData);
        }
        setIsModalOpen(false);
    };

    const handleDeleteCompany = (id) => {
        if (window.confirm("¿Seguro que desea eliminar esta empresa? Esto podría afectar a los usuarios asociados.")) {
            deleteCompany(id);
        }
    };

    const toggleModule = (serviceId) => {
        setFormData(prev => {
            const mods = prev.modules.includes(serviceId)
                ? prev.modules.filter(m => m !== serviceId)
                : [...prev.modules, serviceId];
            return { ...prev, modules: mods };
        });
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



    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestión de Empresas</h1>
                    <p className="text-slate-500">Administra tus clientes y sus módulos contratados.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={20} /> Nueva Empresa
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(company => (
                    <div key={company.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                            {company.logo ? (
                                <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
                            ) : (
                                <Building size={48} className="text-slate-300" />
                            )}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => handleOpenModal(company)} className="bg-white p-2 rounded-full shadow text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteCompany(company.id)} className="bg-white p-2 rounded-full shadow text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{company.name}</h3>
                            <div className="space-y-2 text-sm text-slate-500 mb-4">
                                <p className="flex items-center gap-2"><MapPin size={14} /> {company.address || 'Sin dirección'}</p>
                                <p className="flex items-center gap-2"><Mail size={14} /> {company.email || 'Sin email'}</p>
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Módulos Activos</p>
                                <div className="flex flex-wrap gap-1">
                                    {company.modules?.slice(0, 4).map(m => (
                                        <span key={m} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100">
                                            {SERVICE_TYPES.find(s => s.id === m)?.label || m}
                                        </span>
                                    ))}
                                    {company.modules?.length > 4 && (
                                        <span className="bg-slate-50 text-slate-500 text-xs px-2 py-1 rounded border border-slate-200">+{company.modules.length - 4}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-xl font-bold text-slate-800">{currentCompany ? 'Editar Empresa' : 'Nueva Empresa'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Logo de la Empresa</label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {formData.logo ? (
                                            <img src={formData.logo} alt="Preview" className="h-20 object-contain mb-2" />
                                        ) : (
                                            <Upload size={32} className="text-slate-400 mb-2" />
                                        )}
                                        <p className="text-sm text-slate-500">{formData.logo ? 'Cambiar Logo' : 'Subir Logo (JPG/PNG)'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre Comercial *</label>
                                        <StyledInput value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Grúas Patito" />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dirección Fiscal</label>
                                    <StyledInput value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle, Número, Colonia, Ciudad, CP" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email de Contacto</label>
                                    <StyledInput value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contacto@empresa.com" />
                                </div>
                            </div>

                            <SectionTitle title="Módulos Contratados" icon={<Shield size={18} />} />
                            <p className="text-sm text-slate-500 mb-4">Seleccione los servicios a los que tendrá acceso esta empresa.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {SERVICE_TYPES.map(service => {
                                    const isSelected = formData.modules.includes(service.id);
                                    return (
                                        <div
                                            key={service.id}
                                            onClick={() => toggleModule(service.id)}
                                            className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                        >
                                            <div className={`text-${isSelected ? 'blue-600' : 'slate-400'}`}>
                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-600'}`}>{service.label}</p>
                                                <p className="text-xs text-slate-400 capitalize">{service.category}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>


                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
                            <button onClick={handleSaveCompany} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Guardar Empresa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyManagement;
