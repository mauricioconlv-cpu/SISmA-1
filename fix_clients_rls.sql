-- FIX RLS POLICIES FOR CLIENTS AND TARIFFS
-- This script drops loose/incorrect policies and enforces strict Company-based isolation.

-- 1. CLEANUP OLD POLICIES (To avoid conflicts)
DROP POLICY IF EXISTS "Users can see own company clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own company clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own company clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own company clients" ON public.clients;

DROP POLICY IF EXISTS "Users can see own client tariffs" ON public.client_tariffs;
DROP POLICY IF EXISTS "Users can insert own client tariffs" ON public.client_tariffs;
DROP POLICY IF EXISTS "Users can update own client tariffs" ON public.client_tariffs;
DROP POLICY IF EXISTS "Users can delete own client tariffs" ON public.client_tariffs;


-- 2. ENABLE RLS (Just in case)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tariffs ENABLE ROW LEVEL SECURITY;


-- 3. DEFINE STRICT POLICIES FOR 'CLIENTS'

-- SELECT: Users can only see clients belonging to their company
CREATE POLICY "policy_select_clients" ON public.clients
FOR SELECT USING (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- INSERT: Users can only insert clients IF the company_id matches their own
CREATE POLICY "policy_insert_clients" ON public.clients
FOR INSERT WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- UPDATE: Users can only update clients of their company
CREATE POLICY "policy_update_clients" ON public.clients
FOR UPDATE USING (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- DELETE: Users can only delete (soft or hard) clients of their company
CREATE POLICY "policy_delete_clients" ON public.clients
FOR DELETE USING (
    company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
);


-- 4. DEFINE STRICT POLICIES FOR 'CLIENT_TARIFFS'
-- Tariffs depend on Clients, so permission checks propagate through the client_id.

-- SELECT
CREATE POLICY "policy_select_tariffs" ON public.client_tariffs
FOR SELECT USING (
    client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- INSERT
CREATE POLICY "policy_insert_tariffs" ON public.client_tariffs
FOR INSERT WITH CHECK (
    client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- UPDATE
CREATE POLICY "policy_update_tariffs" ON public.client_tariffs
FOR UPDATE USING (
    client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- DELETE
CREATE POLICY "policy_delete_tariffs" ON public.client_tariffs
FOR DELETE USING (
    client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS reparadas y aplicadas estrictamente.';
END $$;
