import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log("--- CHECKING DATABASE STRUCTURE ---");

    // 1. Check for 'companies' table
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(5);

    if (companiesError) {
        console.log("X Table 'companies' NOT found or not accessible:", companiesError.message);
    } else {
        console.log("✓ Table 'companies' found. Count:", companies.length);
        console.table(companies);
    }

    // 2. Check for 'profiles' or 'users'
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles') // Assuming profiles is the user table
        .select('*')
        .eq('email', 'gruaslafundicion@gmail.com');

    if (profilesError) {
        console.log("X Table 'profiles' query failed:", profilesError.message);
    } else {
        console.log("✓ Profile query result:");
        console.table(profiles);
    }
}

checkDatabase().catch(console.error);
