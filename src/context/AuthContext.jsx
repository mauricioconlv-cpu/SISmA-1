import React, { createContext, useState, useContext, useEffect } from 'react';
import { DEFAULT_USUARIOS, ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]); // List of all users
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Load Session
        const storedUser = localStorage.getItem('towing_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // 2. Load Users List (or init with defaults)
        const storedUsers = localStorage.getItem('towing_users_list');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        } else {
            setUsers(DEFAULT_USUARIOS);
            localStorage.setItem('towing_users_list', JSON.stringify(DEFAULT_USUARIOS));
        }

        setLoading(false);
    }, []);

    const login = (email, password) => {
        // 1. EMERGENCY BACKDOOR: Always allow Super Admin default credentials
        // This ensures that even if localStorage is corrupted, the admin can get back in.
        if (email === 'admin@plataforma.com' && password === '1234') {
            const superAdmin = DEFAULT_USUARIOS.find(u => u.rol === ROLES.SUPERADMIN) || {
                id: 999,
                nombre: 'Super Admin Recovery',
                email: 'admin@plataforma.com',
                rol: ROLES.SUPERADMIN,
                company_id: null,
                permissions: ['all']
            };

            const sessionUser = { ...superAdmin, isAuthenticated: true };
            setUser(sessionUser);
            localStorage.setItem('towing_user', JSON.stringify(sessionUser));
            return { success: true, requirePasswordChange: false };
        }

        // 2. Normal Login Flow
        // Find user in the DYNAMIC list, not the constant one
        const foundUser = users.find(u => u.email === email);

        if (!foundUser) {
            return { success: false, message: "Usuario no encontrado" };
        }

        // Mock password check. In real app, hash check.
        // For this prototype, we assume '1234' is the temporary password for everyone initially
        if (password === '1234') {
            // Ensure user has permissions array, default to [] if missing (safety)
            const userWithPermissions = {
                ...foundUser,
                permissions: foundUser.permissions || [],
                company_id: foundUser.company_id, // Ensure company_id is carried over
                isAuthenticated: true
            };

            setUser(userWithPermissions);
            localStorage.setItem('towing_user', JSON.stringify(userWithPermissions));
            return { success: true, requirePasswordChange: false, user: foundUser };
        } else {
            return { success: false, message: "Contraseña incorrecta" };
        }
    };

    const completePasswordChange = (email, newPassword) => {
        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
            const sessionUser = {
                ...foundUser,
                permissions: foundUser.permissions || [],
                company_id: foundUser.company_id,
                isAuthenticated: true
            };
            setUser(sessionUser);
            localStorage.setItem('towing_user', JSON.stringify(sessionUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('towing_user');
        // We do NOT clear the users list, obviously
    };

    // --- User Management Methods ---
    const addUser = (userData) => {
        const newUser = { ...userData, id: Date.now() };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('towing_users_list', JSON.stringify(updatedUsers));
        return newUser;
    };

    const updateUser = (id, userData) => {
        const updatedUsers = users.map(u => u.id === id ? { ...u, ...userData } : u);
        setUsers(updatedUsers);
        localStorage.setItem('towing_users_list', JSON.stringify(updatedUsers));

        // If updating current user, update session too
        if (user && user.id === id) {
            const updatedSession = { ...user, ...userData };
            setUser(updatedSession);
            localStorage.setItem('towing_user', JSON.stringify(updatedSession));
        }
    };

    const deleteUser = (id) => {
        const updatedUsers = users.filter(u => u.id !== id);
        setUsers(updatedUsers);
        localStorage.setItem('towing_users_list', JSON.stringify(updatedUsers));
    };

    const hasPermission = (serviceId) => {
        if (!user) return false;
        // Super Admin has access to EVERYTHING
        if (user.rol === ROLES.SUPERADMIN) return true;
        if (user.permissions && user.permissions.includes('all')) return true;
        return user.permissions?.includes(serviceId);
    };

    // Scope Check: Can current user manage target user?
    const canManageUser = (targetUser) => {
        if (!user) return false;
        if (user.rol === ROLES.SUPERADMIN) return true; // Super Admin manages everyone

        if (user.rol === ROLES.ADMIN) {
            // Company Admin can only manage users in their OWN company
            // AND cannot manage Super Admins (obviously)
            // AND usually shouldn't manage other Admins unless specified, but let's say they can manage their staff
            return targetUser.company_id === user.company_id && targetUser.rol !== ROLES.SUPERADMIN;
        }

        return false; // Regular users manage no one
    };

    return (
        <AuthContext.Provider value={{
            user,
            users, // Expose users list
            login,
            logout,
            completePasswordChange,
            hasPermission,
            canManageUser,
            loading,
            addUser,    // Expose CRUD
            updateUser,
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
