import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, X, Check, Search, AlertCircle, Wrench } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { SectionTitle, StyledInput, StyledSelect } from '../Shared/UIComponents';

const TeamManagement = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        crane_type: 'Plataforma', // Default
        additional_tools: [],
        typification: 'Grúa Tipo A',
        brand: '',
        color: '',
        economic_number: '',
        plates: '',
        is_federal: false
    });

    useEffect(() => {
        if (user?.company_id) {
            fetchVehicles();
        }
    }, [user]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('company_id', user.company_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleToolToggle = (tool) => {
        setFormData(prev => {
            const tools = prev.additional_tools || [];
            if (tools.includes(tool)) {
                return { ...prev, additional_tools: tools.filter(t => t !== tool) };
            } else {
                return { ...prev, additional_tools: [...tools, tool] };
            }
        });
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            // Validate required fields
            if (!formData.name || !formData.plates) {
                alert("Nombre y Placas son obligatorios");
                return;
            }

            const payload = {
                company_id: user.company_id,
                name: formData.name,
                type: formData.crane_type, // Mapping type to crane_type for simple display if needed, or storing both
                crane_type: formData.crane_type,
                additional_tools: formData.additional_tools,
                typification: formData.typification,
                brand: formData.brand,
                color: formData.color,
                economic_number: formData.economic_number,
                plates: formData.plates,
                is_federal: formData.is_federal,
                status: 'Disponible'
            };

            const { error } = await supabase
                .from('vehicles')
                .insert([payload]);

            if (error) throw error;

            alert("Unidad registrada exitosamente.");
            setShowModal(false);
            setFormData({
                name: '',
                crane_type: 'Plataforma',
                additional_tools: [],
                typification: 'Grúa Tipo A',
                brand: '',
                color: '',
                economic_number: '',
                plates: '',
                is_federal: false
            });
            fetchVehicles();

        } catch (error) {
            console.error("Error adding vehicle:", error);
            alert("Error al registrar: " + error.message);
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (!confirm("¿Estás seguro de eliminar esta unidad?")) return;
        try {
            const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchVehicles();
        } catch (error) {
            console.error("Error deleting vehicle:", error);
            alert("Error al eliminar");
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.plates?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to check if tools section should be shown
    const showTools = ['Plataforma', 'Arrastre', 'Doble Equipo'].includes(formData.crane_type);

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-8">
                <SectionTitle title="Gestión de Equipo" icon={<Truck size={24} />} />
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Nueva Grúa
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o placas..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* GRID VIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                    <Truck size={24} />
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${vehicle.status === 'Disponible' ? 'bg-green-100 text-green-700' :
                                        vehicle.status === 'En Servicio' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {vehicle.status}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{vehicle.name}</h3>
                            <p className="text-slate-500 text-sm mb-4">{vehicle.crane_type || vehicle.type} • {vehicle.plates}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {(vehicle.additional_tools || []).slice(0, 3).map((tool, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                                        {tool}
                                    </span>
                                ))}
                                {(vehicle.additional_tools || []).length > 3 && (
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">+{vehicle.additional_tools.length - 3}</span>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-mono">{vehicle.economic_number || 'S/N'}</span>
                                <button
                                    onClick={() => handleDeleteVehicle(vehicle.id)}
                                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredVehicles.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Truck size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No se encontraron unidades registradas.</p>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Registrar Nueva Unidad</h2>
                                <p className="text-sm text-slate-500">Completa la ficha técnica del vehículo.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddVehicle} className="p-6 space-y-8">

                            {/* SECCIÓN A: CLASIFICACIÓN */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-blue-800 bg-blue-50 p-2 rounded-lg w-fit pr-4">
                                    <Truck size={18} />
                                    <span className="font-bold text-sm uppercase">Sección A: Clasificación</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Interno (Alias)</label>
                                        <StyledInput name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej. Grúa 05" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Grúa</label>
                                        <StyledSelect name="crane_type" value={formData.crane_type} onChange={handleInputChange}>
                                            <option value="Plataforma">Plataforma</option>
                                            <option value="Arrastre">Arrastre</option>
                                            <option value="Doble Equipo">Doble Equipo</option>
                                            <option value="Under">Under (Sótano)</option>
                                            <option value="Equipo Pesado">Equipo Pesado</option>
                                        </StyledSelect>
                                    </div>
                                </div>

                                {/* CONDITIONAL TOOLS */}
                                {showTools && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Herramienta Adicional</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {['Go-jacks', 'Patines', 'Dollys', 'Jumper'].map(tool => (
                                                <label key={tool} className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.additional_tools.includes(tool)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-slate-300 group-hover:border-blue-400'
                                                        }`}>
                                                        {formData.additional_tools.includes(tool) && <Check size={14} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.additional_tools.includes(tool)}
                                                        onChange={() => handleToolToggle(tool)}
                                                    />
                                                    <span className="text-sm text-slate-700 select-none group-hover:text-blue-600">{tool}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* SECCIÓN B: NORMATIVA */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-purple-800 bg-purple-50 p-2 rounded-lg w-fit pr-4">
                                    <AlertCircle size={18} />
                                    <span className="font-bold text-sm uppercase">Sección B: Normativa</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipificación Oficial</label>
                                    <StyledSelect name="typification" value={formData.typification} onChange={handleInputChange}>
                                        <option value="Grúa Tipo A">Grúa Tipo A (Menor a 3.5 tons)</option>
                                        <option value="Grúa Tipo B">Grúa Tipo B</option>
                                        <option value="Grúa Tipo C">Grúa Tipo C</option>
                                        <option value="Grúa Tipo D">Grúa Tipo D (Industrial)</option>
                                    </StyledSelect>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* SECCIÓN C: IDENTIDAD */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-800 bg-green-50 p-2 rounded-lg w-fit pr-4">
                                    <Search size={18} />
                                    <span className="font-bold text-sm uppercase">Sección C: Identidad</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                                        <StyledInput name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Ej. International" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Modelo/Color</label>
                                        <StyledInput name="color" value={formData.color} onChange={handleInputChange} placeholder="Ej. 2015 Blanco" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">No. Económico</label>
                                        <StyledInput name="economic_number" value={formData.economic_number} onChange={handleInputChange} placeholder="Ej. 104" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Placas</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-slate-400 font-bold">MX</span>
                                            </div>
                                            <input
                                                name="plates"
                                                value={formData.plates}
                                                onChange={handleInputChange}
                                                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
                                                placeholder="AAA-000-A"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors h-[42px]">
                                        <input
                                            type="checkbox"
                                            name="is_federal"
                                            checked={formData.is_federal}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">¿Son Placas Federales?</span>
                                    </label>
                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Check size={18} /> Guardar Unidad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
