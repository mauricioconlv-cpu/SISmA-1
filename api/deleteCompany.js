
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { company_id } = req.body;

    if (!company_id) {
        return res.status(400).json({ error: 'Missing company_id' });
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
        console.log(`[deleteCompany] Starting deletion for company: ${company_id}`);

        // 1. Get all profiles associated with the company
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('company_id', company_id);

        if (fetchError) throw fetchError;

        console.log(`[deleteCompany] Found ${profiles.length} profiles to delete.`);

        // 2. Delete Auth Users (This allows us to clean up accounts)
        // Note: If profiles are ON DELETE CASCADE with auth.users, this deletes profiles too.
        // If not, we might need to delete profiles manually. We'll do both to be safe.
        const userIds = profiles.map(p => p.id);

        for (const userId of userIds) {
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
            if (deleteAuthError) {
                console.error(`[deleteCompany] Error deleting user ${userId}:`, deleteAuthError);
                // Continue trying to delete others even if one fails
            }
        }

        // 3. Delete Profiles Explicitly (in case Auth delete didn't cascade or if profiles exist without active auth user for some reason)
        const { error: deleteProfilesError } = await supabase
            .from('profiles')
            .delete()
            .eq('company_id', company_id);

        if (deleteProfilesError) console.error("Error deleting profiles:", deleteProfilesError);

        // 4. Delete Company Modules
        const { error: deleteModulesError } = await supabase
            .from('company_modules')
            .delete()
            .eq('company_id', company_id);

        if (deleteModulesError) console.error("Error deleting modules:", deleteModulesError);

        // 5. Finally, Delete the Company
        const { error: deleteCompanyError } = await supabase
            .from('companies')
            .delete()
            .eq('id', company_id);

        if (deleteCompanyError) throw deleteCompanyError;

        return res.status(200).json({ success: true, message: 'Company and related data deleted successfully' });

    } catch (error) {
        console.error('[deleteCompany] API Error:', error);
        // Check for specific constraint errors
        if (error.code === '23503') { // Foreign Key Violation
            return res.status(409).json({ error: 'No se puede eliminar: Existen otros datos (ej. servicios, vehículos) vinculados a esta empresa. Bórralos primero.' });
        }
        return res.status(500).json({ error: error.message });
    }
}
