
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields: email, password' });
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
        // 1. Get User ID from Profiles (The ID in profiles IS the Auth ID)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'Usuario no encontrado con ese email.' });
        }

        const userId = profile.id;

        // 2. Update Password in Auth
        const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
            userId,
            { password: password }
        );

        if (authError) throw authError;

        return res.status(200).json({ success: true, message: 'Contraseña actualizada' });

    } catch (error) {
        console.error('Reset Password API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
