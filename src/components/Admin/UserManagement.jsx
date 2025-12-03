import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, CheckSquare, Square, Shield, Building } from 'lucide-react';
import { SERVICE_TYPES, ROLES } from '../../utils/constants';
import { SectionTitle, StyledInput, StyledSelect } from '../Shared/UIComponents';
import { useAuth } from '../../context/AuthContext';
import { useCompanies } from '../../context/CompanyContext';

const UserManagement = () => {
    const { user: currentUser, canManageUser, users, addUser, updateUser, deleteUser } = useAuth();
    const { companies } = useCompanies();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        rol: ROLES.USER,
        company_id: '',
        permissions: []
    });

    // Filter users based on scope
    const visibleUsers = users.filter(u => {
        if (!currentUser) return false;
        if (currentUser.rol === ROLES.SUPERADMIN) return true;
        return u.company_id === currentUser.company_id && u.rol !== ROLES.SUPERADMIN;
    });

    const handleOpenModal = (targetUser = null) => {
        if (targetUser) {
            setUserToEdit(targetUser);
            setFormData({
                nombre: targetUser.nombre,
                email: targetUser.email,
                rol: targetUser.rol,
                company_id: targetUser.company_id || '',
                permissions: targetUser.permissions || []
            });
        } else {
            setUserToEdit(null);
            setFormData({
                nombre: '',
                email: '',
                rol: ROLES.USER,
                company_id: currentUser.rol === ROLES.SUPERADMIN ? '' : currentUser.company_id,
                permissions: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveUser = () => {
        if (!formData.nombre || !formData.email) return alert("Nombre y Email son obligatorios");
        if (currentUser.rol === ROLES.SUPERADMIN && !formData.company_id && formData.rol !== ROLES.SUPERADMIN) {
            return alert("Debe asignar una empresa al usuario.");
        }

        const finalData = {
            ...formData,
            company_id: currentUser.rol === ROLES.SUPERADMIN ? Number(formData.company_id) : currentUser.company_id
        };

        if (userToEdit) {
            updateUser(userToEdit.id, finalData);
        } else {
            addUser(finalData);
        }
        setIsModalOpen(false);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm("¿Seguro que desea eliminar este usuario?")) {
            deleteUser(id);
        }
    };

    // Helper to get available permissions for the target user based on their company
    const getAvailablePermissions = () => {
        // If Super Admin is creating a Super Admin, all permissions are available
        if (formData.rol === ROLES.SUPERADMIN) return SERVICE_TYPES.map(s => s.id);

        // Determine target company ID
        const targetCompanyId = currentUser.rol === ROLES.SUPERADMIN ? Number(formData.company_id) : currentUser.company_id;

        // Find the company to check purchased modules
        const targetCompany = companies.find(c => c.id === targetCompanyId);

        if (!targetCompany) return [];

        return targetCompany.modules || [];
    };

    const togglePermission = (serviceId) => {
        // 1. Check if the COMPANY has this module purchased
        const available = getAvailablePermissions();
        if (!available.includes(serviceId)) return;

        // 2. Check if CURRENT USER has this permission (to assign it) - only for non-SuperAdmin
        if (currentUser.rol !== ROLES.SUPERADMIN && !currentUser.permissions.includes(serviceId) && !currentUser.permissions.includes('all')) {
            return;
        }

        setFormData(prev => {
            const perms = prev.permissions.includes(serviceId)
                ? prev.permissions.filter(p => p !== serviceId)
                : [...prev.permissions, serviceId];
            return { ...prev, permissions: perms };
        });
    };

    const toggleAllPermissions = () => {
        const available = getAvailablePermissions();

        // Filter by what the current user can actually assign
        const assignable = currentUser.rol === ROLES.SUPERADMIN
            ? available
            : available.filter(p => currentUser.permissions.includes(p));

        if (formData.permissions.length >= assignable.length) {
            setFormData(prev => ({ ...prev, permissions: [] }));
        } else {
            setFormData(prev => ({ ...prev, permissions: assignable }));
        }
    };

    const getCompanyName = (id) => {
        const comp = companies.find(c => c.id === id);
        return comp ? comp.name : 'N/A';
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
                    <p className="text-slate-500">
                        {currentUser?.rol === ROLES.SUPERADMIN
                            ? 'Administración Global de Empresas y Usuarios'
                            : `Administración de Usuarios - ${getCompanyName(currentUser?.company_id)}`}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-bold text-slate-600">Usuario</th>
                            {currentUser?.rol === ROLES.SUPERADMIN && <th className="p-4 font-bold text-slate-600">Empresa</th>}
                            <th className="p-4 font-bold text-slate-600">Email</th>
                            <th className="p-4 font-bold text-slate-600">Rol</th>
                            <th className="p-4 font-bold text-slate-600">Permisos</th>
                            <th className="p-4 font-bold text-slate-600 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleUsers.map(user => (
                            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                                        <Users size={16} />
                                    </div>
                                    {user.nombre}
                                </td>
                                {currentUser?.rol === ROLES.SUPERADMIN && (
                                    <td className="p-4 text-slate-500 text-sm">
                                        {user.rol === ROLES.SUPERADMIN ? <span className="italic text-slate-400">Global</span> : getCompanyName(user.company_id)}
                                    </td>
                                )}
                                <td className="p-4 text-slate-500">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.rol === ROLES.SUPERADMIN ? 'bg-purple-100 text-purple-700' :
                                            user.rol === ROLES.ADMIN ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.permissions?.includes('all') ? (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded border border-green-200">Todo</span>
                                        ) : (
                                            user.permissions?.slice(0, 2).map(p => (
                                                <span key={p} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded border border-slate-200">
                                                    {SERVICE_TYPES.find(s => s.id === p)?.label || p}
                                                </span>
                                            ))
                                        )}
                                        {user.permissions?.length > 2 && (
                                            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded border border-slate-200">+{user.permissions.length - 2}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        {canManageUser(user) && (
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre</label>
                                    <StyledInput value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                                    <StyledInput value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>

                                {/* COMPANY SELECTOR - ONLY FOR SUPER ADMIN */}
                                {currentUser?.rol === ROLES.SUPERADMIN && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Empresa Asignada</label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-3 text-slate-400" size={18} />
                                            <select
                                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                                value={formData.company_id}
                                                onChange={e => setFormData({ ...formData, company_id: e.target.value, permissions: [] })} // Reset permissions on company change
                                            >
                                                <option value="">-- Seleccione Empresa --</option>
                                                {companies.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rol</label>
                                    <StyledSelect value={formData.rol} onChange={e => setFormData({ ...formData, rol: e.target.value })}>
                                        <option value={ROLES.USER}>Operador / Técnico</option>
                                        {currentUser?.rol === ROLES.SUPERADMIN && <option value={ROLES.ADMIN}>Administrador de Empresa</option>}
                                        {currentUser?.rol === ROLES.SUPERADMIN && <option value={ROLES.SUPERADMIN}>Super Admin</option>}
                                    </StyledSelect>
                                </div>
                            </div>

                            <SectionTitle title="Permisos de Acceso" icon={<Shield size={18} />} />

                            <div className="mb-4">
                                <button onClick={toggleAllPermissions} className="text-sm text-blue-600 font-bold hover:underline">
                                    {formData.permissions.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Disponibles'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {SERVICE_TYPES.map(service => {
                                    const isSelected = formData.permissions.includes(service.id);

                                    // Check if the COMPANY has purchased this module
                                    const companyHasModule = getAvailablePermissions().includes(service.id);

                                    // Check if current user can assign it
                                    const canAssign = (currentUser.rol === ROLES.SUPERADMIN || currentUser.permissions.includes(service.id) || currentUser.permissions.includes('all')) && companyHasModule;

                                    return (
                                        <div
                                            key={service.id}
                                            onClick={() => canAssign && togglePermission(service.id)}
                                            className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${!canAssign ? 'opacity-40 cursor-not-allowed bg-slate-100' :
                                                    isSelected ? 'bg-blue-50 border-blue-200 cursor-pointer' : 'bg-white border-slate-200 hover:border-blue-300 cursor-pointer'
                                                }`}
                                        >
                                            <div className={`text-${isSelected ? 'blue-600' : 'slate-400'}`}>
                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-600'}`}>{service.label}</p>
                                                <p className="text-xs text-slate-400 capitalize">{service.category}</p>
                                                {!companyHasModule && <p className="text-[10px] text-red-400 font-bold">No contratado</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancelar</button>
                            <button onClick={handleSaveUser} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Guardar Usuario</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
