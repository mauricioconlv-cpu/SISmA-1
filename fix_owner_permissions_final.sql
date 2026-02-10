-- FIX OWNER PERMISSIONS FINAL
-- Grants full access to 'owner' role across all major tables.

-- 1. Ensure the user is an owner (just in case they missed the previous step)
UPDATE public.profiles
SET role = 'owner'
WHERE email = 'mauricioconlv@gmail.com';

-- 2. ENABLE RLS (Just to be safe, should already be on)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tariffs ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING "OWNER" POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Owner can do everything on companies" ON public.companies;
DROP POLICY IF EXISTS "Owner can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner can do everything on services" ON public.services;
DROP POLICY IF EXISTS "Owner can do everything on clients" ON public.clients;
DROP POLICY IF EXISTS "Owner can do everything on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Owner can do everything on tariffs" ON public.client_tariffs;

-- 4. CREATE "GOD MODE" POLICIES FOR OWNER
-- These policies use a subquery to check the role of the current user.

-- COMPANIES
CREATE POLICY "Owner can do everything on companies" ON public.companies
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    );

-- PROFILES
CREATE POLICY "Owner can do everything on profiles" ON public.profiles
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    );

-- SERVICES
CREATE POLICY "Owner can do everything on services" ON public.services
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    );

-- CLIENTS
CREATE POLICY "Owner can do everything on clients" ON public.clients
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    );

-- VEHICLES
CREATE POLICY "Owner can do everything on vehicles" ON public.vehicles
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    );

-- TARIFFS
CREATE POLICY "Owner can do everything on tariffs" ON public.client_tariffs
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    )
    WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
    );

DO $$
BEGIN
    RAISE NOTICE '✅ OWNER PERMISSIONS GRANTED: User with role=owner now has full access.';
END $$;
