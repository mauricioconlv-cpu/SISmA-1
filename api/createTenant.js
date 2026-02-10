import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Extract Data
    const { email, password, company_name, owner_name } = req.body;

    if (!email || !password || !company_name) {
        return res.status(400).json({ error: 'Missing required fields (email, password, company_name)' });
    }

    // 2. Initialize Supabase Admin
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

    let userId = null;

    try {
        // 3. Create Auth User (Step A)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                full_name: owner_name || 'Admin',
                rol: 'owner' // Metadata role
            }
        });

        if (authError) throw authError;

        userId = authData.user.id;
        console.log(`✅ Auth User Created: ${userId}`);

        // 4. Call DB Function (Step B)
        const { data: dbData, error: dbError } = await supabase.rpc('create_complete_tenant', {
            p_user_id: userId,
            p_email: email,
            p_company_name: company_name,
            p_owner_name: owner_name || 'Admin',
            p_password_preview: '***'
        });

        if (dbError) {
            console.error('❌ DB RPC Error:', dbError);
            throw dbError;
        }

        console.log('✅ Tenant Created:', dbData);

        return res.status(200).json({
            success: true,
            tenant: dbData
        });

    } catch (error) {
        console.error('API Error:', error);

        // ROLLBACK: If DB fails, delete the orphaned Auth User
        if (userId) {
            console.warn(`⚠️ Rolling back: Deleting orphaned user ${userId}`);
            await supabase.auth.admin.deleteUser(userId);
        }

        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
