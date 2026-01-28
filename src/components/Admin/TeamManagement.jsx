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

    const [formData, setFormData] = useState({
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

    // --- TAB STATE ---
    const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'staff'
    const [staff, setStaff] = useState([]);

    // Staff Form State
    const [staffFormData, setStaffFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'operator', // operator | executive
        permissions: {
            can_edit_expedient: false,
            can_edit_costs: false
        }
    });

    useEffect(() => {
        if (user?.company_id) {
            fetchVehicles();
            fetchStaff();
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

    const fetchStaff = async () => {
        try {
            // Fetch profiles with company_id
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', user.company_id)
                .neq('email', user.email); // Don't show myself

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleStaffInputChange = (e) => {
        const { name, value } = e.target;
        setStaffFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setStaffFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [name]: checked
            }
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

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Auth User (Note: This might require Service Role if disabled on client side, attempting anyway)
            // Strategy: Use signUp. If it fails due to session, show warning.
            // Ideally, we just insert into profiles if auth triggers handle creation, but here we likely need to create both.
            // CAUTION: Client-side creation of other users usually requires specific config or "Invite" API.
            // For this implementation, we will assume we can Insert to Profiles if Auth fails or use a workaround.
            // Actually, best effort: Try signUp.

            if (!staffFormData.email || !staffFormData.password || !staffFormData.full_name) {
                alert("Todos los campos son obligatorios.");
                return;
            }

            // A. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: staffFormData.email,
                password: staffFormData.password,
                options: {
                    data: {
                        full_name: staffFormData.full_name,
                        role: staffFormData.role, // Metadata
                        company_id: user.company_id
                    }
                }
            });

            if (authError) {
                console.error("Error creating auth user:", authError);
                throw authError; // Stop here
            }

            const newUserId = authData.user?.id;

            if (newUserId) {
                // B. Create/Update Profile (Trigger might do this, but we ensure permissions are set)
                // We'll update the profile with specific fields
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: newUserId,
                        email: staffFormData.email,
                        full_name: staffFormData.full_name,
                        role: staffFormData.role,
                        company_id: user.company_id,
                        permissions: staffFormData.permissions // SAVE JSONB
                    });

                if (profileError) {
                    console.error("Error updating profile:", profileError);
                    alert("Usuario creado en Auth pero falló el perfil. Contacte soporte.");
                } else {
                    alert("Usuario creado exitosamente.");
                    setShowModal(false);
                    fetchStaff();
                }
            } else {
                // If email confirmation is required, user.id might be null in some configs or data null.
                alert("Usuario registrado. Por favor verifique el correo si es necesario.");
                setShowModal(false);
            }

        } catch (error) {
            alert("Error al crear usuario: " + error.message);
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
            <div className="flex justify-between items-center mb-6">
                <SectionTitle title="Gestión de Equipo" icon={<Truck size={24} />} />

                {/* TABS HEADER */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('vehicles')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'vehicles' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Unidades (Grúas)
                    </button>
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Personal
                    </button>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <Plus size={20} /> {activeTab === 'vehicles' ? 'Nueva Grúa' : 'Nuevo Usuario'}
                </button>
            </div>

            {/* TAB CONTENT: VEHICLES */}
            {activeTab === 'vehicles' && (
                <>
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
                </>
            )}

            {/* TAB CONTENT: STAFF */}
            {activeTab === 'staff' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Nombre</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Permisos</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {staff.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-800">{member.full_name}</td>
                                    <td className="p-4 text-slate-500">{member.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${member.role === 'executive' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {member.role === 'executive' ? 'Ejecutivo' : 'Operador'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {member.role === 'executive' && member.permissions && (
                                            <div className="flex gap-2">
                                                {member.permissions.can_edit_expedient && (
                                                    <span className="text-[10px] bg-green-50 text-green-600 px-1 rounded border border-green-200">Expediente</span>
                                                )}
                                                {member.permissions.can_edit_costs && (
                                                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-200">Costos</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right text-slate-400">
                                        {/* Actions Placeholder */}
                                        ...
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        No hay personal registrado aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {activeTab === 'vehicles' ? 'Registrar Nueva Unidad' : 'Registrar Nuevo Usuario'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {activeTab === 'vehicles' ? 'Completa la ficha técnica del vehículo.' : 'Crea un acceso para tu equipo.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {activeTab === 'vehicles' ? (
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
                        ) : (
                            // --- FORMULARIO DE PERSONAL (STAFF) ---
                            <form onSubmit={handleAddStaff} className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                                            <StyledInput name="full_name" value={staffFormData.full_name} onChange={handleStaffInputChange} placeholder="Ej. Juan Pérez" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                                            <StyledInput name="email" value={staffFormData.email} onChange={handleStaffInputChange} placeholder="usuario@empresa.com" type="email" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                                            <StyledInput name="password" value={staffFormData.password} onChange={handleStaffInputChange} placeholder="******" type="password" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                            <StyledSelect name="role" value={staffFormData.role} onChange={handleStaffInputChange}>
                                                <option value="operator">Operador (Solo App)</option>
                                                <option value="executive">Ejecutivo de Cabina</option>
                                            </StyledSelect>
                                        </div>
                                    </div>

                                    {/* PERMISOS GRANULARES (SOLO EJECUTIVOS) */}
                                    {staffFormData.role === 'executive' && (
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 animate-fade-in">
                                            <div className="flex items-center gap-2 text-purple-800 mb-3">
                                                <Wrench size={16} />
                                                <span className="font-bold text-xs uppercase">Permisos Especiales</span>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="can_edit_expedient"
                                                        checked={staffFormData.permissions.can_edit_expedient}
                                                        onChange={handlePermissionChange}
                                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">Editar Expedientes</p>
                                                        <p className="text-xs text-slate-500">Permite modificar datos del servicio después de creado.</p>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="can_edit_costs"
                                                        checked={staffFormData.permissions.can_edit_costs}
                                                        onChange={handlePermissionChange}
                                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">Modificar Costos</p>
                                                        <p className="text-xs text-slate-500">Permite alterar o sobreescribir las tarifas automáticas.</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-0">
                                    <button onClick={() => setShowModal(false)} type="button" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg">Crear Usuario</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
