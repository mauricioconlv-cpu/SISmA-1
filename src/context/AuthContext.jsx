import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                mapSessionToUser(session.user);
            } else {
                setLoading(false);
            }
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                mapSessionToUser(session.user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const mapSessionToUser = (supabaseUser) => {
        // Here we map the Auth user to our App's user structure
        // In a production app, we would fetch this 'profile' from a 'users' table in DB

        let appUser = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            auth_id: supabaseUser.id,
            isAuthenticated: true
        };

        // --- HARDCODED ROLES FOR NOW (Transition Phase) ---
        if (supabaseUser.email === 'gruaslafundicion@gmail.com') {
            appUser = {
                ...appUser,
                nombre: 'Grúas La Fundición',
                rol: ROLES.CLIENT, // Assuming 'Cliente' role exists or we treat as User
                company_id: 'cliente_01',
                permissions: ['read_own', 'create_service']
            };
        } else if (supabaseUser.email === 'admin@gruas.com') { // Example for Admin
            appUser = {
                ...appUser,
                nombre: 'Admin Principal',
                rol: ROLES.ADMIN,
                company_id: 'admin_corp',
                permissions: ['all']
            };
        } else {
            // Default Fallback
            appUser = {
                ...appUser,
                nombre: supabaseUser.email.split('@')[0],
                rol: ROLES.OPERATOR, // Default to operator/guest if unknown
                permissions: []
            };
        }

        setUser(appUser);
        setLoading(false);
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        // State update handled by onAuthStateChange
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.rol === ROLES.SUPERADMIN) return true;
        if (user.permissions && user.permissions.includes('all')) return true;
        return user.permissions?.includes(permission);
    };

    // Kept for compatibility, though we might not use the users-list anymore
    const users = [];
    const addUser = () => console.warn("User management now handled by Supabase Dashboard");
    const updateUser = () => console.warn("User management now handled by Supabase Dashboard");
    const deleteUser = () => console.warn("User management now handled by Supabase Dashboard");
    const completePasswordChange = () => true;
    const canManageUser = () => false;

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            loading,
            hasPermission,
            // Legacy/Compat
            users,
            addUser,
            updateUser,
            deleteUser,
            completePasswordChange,
            canManageUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
