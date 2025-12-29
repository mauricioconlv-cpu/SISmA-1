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

            // 1. Fetch Profile/User Data (REAL ARCHITECTURE)
            console.log("Buscando perfil para ID:", supabaseUser.id);

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*') // Bringing everything
                .eq('id', supabaseUser.id)
                .single();

            if (profileError) {
                console.error("Error fetching profile from DB:", profileError);
            }

            if (profile) {
                console.log("✅ Perfil cargado de DB:", profile);
                // MERGE: Combine auth user with profile data as requested
                appUser = { ...appUser, ...profile };

                // Ensure helper 'rol' matches 'role' if profile overrides it
                if (profile.role) {
                    appUser.rol = profile.role;
                }
            } else {
                console.warn("⚠️ No se encontró perfil en DB para este usuario. Usando defaults.");
            }

            // (Optional) Keep Superadmin override just in case of DB sync issues during dev
            if (supabaseUser.email === 'mauricioconlv@gmail.com') {
                appUser.role = ROLES.SUPERADMIN;
                appUser.rol = ROLES.SUPERADMIN;
            }

            // Determine Company ID
            // For now, logic remains similar: map specific emails to specific IDs
            // BUT if profile had company_id, it is already in appUser due to merge!
            if (!appUser.company_id) {
                if (supabaseUser.email === 'gruaslafundicion@gmail.com') {
                    appUser.company_id = 'cliente_01';
                } else if (supabaseUser.email === 'admin@gruas.com') {
                    appUser.company_id = 'admin_corp';
                } else {
                    appUser.company_id = null;
                }
            }

            // 2. FETCH COMPANY CONFIGURATION (REAL ARCHITECTURE)
            if (appUser.company_id) {
                // Fetch company details (optional, but good for name)
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('*')
                    .or(`email.eq.${supabaseUser.email},id.eq.${appUser.company_id}`) // Try to match by ID or Email
                    .maybeSingle(); // Use maybeSingle to avoid error if 0 or >1

                let targetCompanyId = appUser.company_id;

                if (companyData) {
                    appUser.nombre = appUser.nombre || companyData.name; // Use company name if user has no name
                    targetCompanyId = companyData.id;
                    appUser.company_id = targetCompanyId; // Update to real UUID
                }

                // FETCH MODULES TABLE
                const { data: modules, error: modulesError } = await supabase
                    .from('company_modules')
                    .select('module_key')
                    .eq('company_id', targetCompanyId)
                    .eq('is_active', true);

                if (modules && !modulesError) {
                    // Hydrate full service objects
                    const enabledServices = modules.map(m => {
                        return SERVICE_TYPES.find(st => st.id === m.module_key);
                    }).filter(Boolean); // Remove undefineds

                    appUser.company = {
                        ...(companyData || {}),
                        active: true,
                        enabled_services: enabledServices
                    };

                    console.log("✅ Configuración de Empresa Cargada:", enabledServices.length, "módulos.");
                } else {
                    console.warn("⚠️ No se encontraron módulos activos para la empresa:", targetCompanyId);
                    appUser.company = { enabled_services: [] };
                }
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
