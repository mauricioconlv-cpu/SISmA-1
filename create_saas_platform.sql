-- Create a catalog of all available system modules (The "LEGO" bricks)
CREATE TABLE IF NOT EXISTS public.app_modules (
    box_key TEXT PRIMARY KEY, -- e.g., 'tow', 'finance', 'inventory'
    label TEXT NOT NULL,
    description TEXT,
    icon_name TEXT -- Lucide icon name
);

-- Seed available modules
INSERT INTO public.app_modules (box_key, label, description, icon_name)
VALUES 
    -- Operational
    ('tow', 'Servicio de Grúas', 'Módulo operativo para gestión de traslados y rescates.', 'Truck'),
    ('jump', 'Paso de Corriente', 'Servicio de asistencia vial para batería.', 'Battery'),
    ('tire', 'Cambio de Llanta', 'Servicio de asistencia vial para neumáticos.', 'Disc'),
    ('gas', 'Suministro de Gasolina', 'Servicio de entrega de combustible.', 'Fuel'),
    
    -- Administrative / Add-ons
    ('finance', 'Módulo Financiero', 'Gestión de facturación y cobros.', 'DollarSign'),
    ('inventory', 'Inventario', 'Control de refacciones y equipo.', 'Box'),
    ('gps', 'Rastreo GPS', 'Integración con ubicación en tiempo real.', 'MapPin')
ON CONFLICT (box_key) DO NOTHING;

-- Ensure company_modules references this catalog (Optional FK, but good for consistency)
-- ALTER TABLE public.company_modules ADD CONSTRAINT fk_module_key FOREIGN KEY (module_key) REFERENCES public.app_modules(box_key);

-- Policy for Superadmin to read/write everything
CREATE POLICY "Superadmin can manage all companies" ON public.companies
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'superadmin'
        )
    );

-- Policy for Superadmin to see all modules
CREATE POLICY "Superadmin can see all app modules" ON public.app_modules
    FOR SELECT
    USING (true); -- Publicly visible or restricted to authenticated? Let's say all auth users can see what modules exist, or just superadmin.
    -- For now public read is fine for the catalog.

