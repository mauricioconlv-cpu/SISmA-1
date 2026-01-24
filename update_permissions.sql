-- 1. Enable CRUD for company_admin on operational tables

-- Vehicles
CREATE POLICY "Company Admins can CRUD vehicles"
ON public.vehicles
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'company_admin' AND company_id = vehicles.company_id
));

-- Staff/Operators (Assuming table is 'operators' based on typical naming, or 'staff' - adjust if needed)
-- Creating for 'operators' as inferred from context
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    role TEXT,
    status TEXT DEFAULT 'Activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY "Company Admins can CRUD operators"
ON public.operators
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'company_admin' AND company_id = operators.company_id
));

-- Inventory (Future proofing)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id),
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY "Company Admins can CRUD inventory"
ON public.inventory_items
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role = 'company_admin' AND company_id = inventory_items.company_id
));


-- 2. Add 'permissions' column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 3. Create 'executive' role logic implies just using the string 'executive' in the role column.
-- No DDL needed for role value if it's just a text check constraints, 
-- but if there is a constraint:
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('owner', 'admin', 'company_admin', 'superadmin', 'operator', 'executive'));
