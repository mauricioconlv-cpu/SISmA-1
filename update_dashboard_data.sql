-- 1. Agregar columna de Meta Financiera a la tabla de Empresas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS daily_revenue_goal NUMERIC DEFAULT 50000;

-- 2. Crear tabla de Vehículos/Flota (si no existe)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- Ej. Grúa 01
    type TEXT,                   -- Plataforma, Arrastre
    plates TEXT,
    status TEXT DEFAULT 'Disponible', -- Disponible, En Servicio, Mantenimiento, Fuera de Servicio
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Public Write Vehicles" ON public.vehicles FOR ALL USING (true); -- Ajustar según auth real

-- 4. Semilla de Datos (Solo para pruebas)
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT id INTO v_company_id FROM public.companies WHERE email = 'gruaslafundicion@gmail.com';
    
    IF v_company_id IS NOT NULL THEN
        -- Insertar grúas de prueba si no existen
        IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE company_id = v_company_id) THEN
            INSERT INTO public.vehicles (company_id, name, type, status)
            VALUES 
                (v_company_id, 'Grúa 01 - Plataforma', 'Plataforma', 'Disponible'),
                (v_company_id, 'Grúa 02 - Arrastre', 'Arrastre', 'En Servicio'),
                (v_company_id, 'Grúa 03 - Pesada', 'Pesada', 'Mantenimiento'),
                (v_company_id, 'Grúa 04 - Pluma', 'Pluma', 'Disponible');
        END IF;
        
        -- Actualizar meta de ejemplo
        UPDATE public.companies SET daily_revenue_goal = 75000 WHERE id = v_company_id;
    END IF;
END $$;
