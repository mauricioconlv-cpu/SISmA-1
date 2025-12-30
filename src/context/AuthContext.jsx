import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ROLES, SERVICE_TYPES } from '../utils/constants';

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

    const mapSessionToUser = async (supabaseUser) => {
        // Here we map the Auth user to our App's user structure
        // In a production app, we would fetch this 'profile' from a 'users' table in DB

        let appUser = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            auth_id: supabaseUser.id,
            isAuthenticated: true,
            role: ROLES.OPERATOR, // Default safe role
            rol: ROLES.OPERATOR   // Default safe rol
        };

        try {
            if (!supabaseUser?.id) return; // Guard clause to prevent 400 errors

            // 1. Fetch Profile/User Data (REAL ARCHITECTURE) WITH JOIN
            console.log("Buscando perfil para ID:", supabaseUser.id);

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, companies(*, enabled_services)') // Join with explicit column request
                .eq('id', supabaseUser.id)
                .single();

            if (profileError) {
                console.error("Error fetching profile from DB:", profileError);
            }

            if (profile) {
                console.log("✅ Perfil cargado de DB:", profile);
                // MERGE: Combine auth user with profile data
                appUser = { ...appUser, ...profile };

                // Ensure helper 'rol' matches 'role' if profile overrides it
                if (profile.role) {
                    appUser.rol = profile.role;
                }
            } else {
                console.warn("⚠️ No se encontraron perfil en DB. Usando defaults.");
            }

            // ... (Superadmin override kept) ...
            if (supabaseUser.email === 'mauricioconlv@gmail.com') {
                appUser.role = ROLES.SUPERADMIN;
                appUser.rol = ROLES.SUPERADMIN;
            }

            // 2. CONFIGURE COMPANY (From Join or Fallback)
            let companyData = profile?.companies; // Data from JOIN

            // Handle Supabase Array Response (common in Joins)
            if (Array.isArray(companyData)) {
                companyData = companyData[0];
            }

            console.log('Company Data Raw:', companyData);

            // Fallback: If no join data (maybe no FK), but we have company_id or explicit email rule
            if (!companyData) {
                if (!appUser.company_id) {
                    if (supabaseUser.email === 'gruaslafundicion@gmail.com') {
                        appUser.company_id = 'cliente_01'; // Legacy placeholder
                    } else if (supabaseUser.email === 'admin@gruas.com') {
                        appUser.company_id = 'admin_corp';
                    }
                }

                // Try manual fetch if we have an ID or it's a legacy user
                if (appUser.company_id) {
                    const { data: manualCompany } = await supabase
                        .from('companies')
                        .select('*')
                        .or(`email.eq.${supabaseUser.email},id.eq.${appUser.company_id}`)
                        .maybeSingle();
                    companyData = manualCompany;
                }
            }

            if (companyData) {
                appUser.nombre = appUser.full_name || appUser.nombre || companyData.name;
                appUser.company_id = companyData.id;

                // USE ENABLED_SERVICES FROM COMPANIES TABLE
                const enabledModules = companyData.enabled_services || [];

                // Hydrate full service objects
                const hydratedServices = enabledModules.map(key => {
                    return SERVICE_TYPES.find(st => st.id === key);
                }).filter(Boolean);

                appUser.company = {
                    ...companyData,
                    active: true,
                    enabled_services: hydratedServices,
                    modules: enabledModules
                };
                console.log("✅ Configuración de Empresa Cargada:", enabledModules);
            } else {
                appUser.company = { enabled_services: [], modules: [] };
            }

        } catch (error) {
            console.error("Error mapping session:", error);
        }

        console.log("Usuario final mapeado:", appUser);
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
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error en logout remoto (ignorado):", error);
        } finally {
            // ESTO SE DEBE EJECUTAR SIEMPRE
            setUser(null);
            // setSession(null); // Assuming setSession isn't state here, handled by auto-detection usually but let's clear what we can
            // In this file, 'user' is the main state. 'loading' is state.
            // There is no explicit 'setSession' exposed in the snippet I saw earlier, usually handled by onAuthStateChange.
            // But we can force user null.
            localStorage.clear(); // Limpieza nuclear
            window.location.href = '/login'; // Redirección forzada
        }
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
