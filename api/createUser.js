
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, nombre, rol, company_id, permissions } = req.body;

    if (!email || !password || !nombre) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server misconfiguration: Missing Supabase keys' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                nombre,
                rol,
                company_id
            }
        });

        if (authError) throw authError;

        const userId = authData.user.id;

        // 2. Create Profile in Public Table
        const { error: profileError } = await supabase.from('profiles').insert([
            {
                id: userId,
                email,
                full_name: nombre,
                role: rol, // Correct column is 'role'
                company_id: company_id ? Number(company_id) : null,
                permissions: permissions || []
            }
        ]);

        if (profileError) {
            // Rollback Auth User if profile creation fails? 
            // For simplicity, we just delete the user we just created.
            await supabase.auth.admin.deleteUser(userId);
            throw profileError;
        }

        return res.status(200).json({ success: true, userId });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
