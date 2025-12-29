-- PASO 2: INFRAESTRUCTURA DE TARIFAS
-- Ejecuta este script para crear las tablas de gestión de Clientes y Precios.

-- 1. Tabla de Clientes (Aseguradoras / Particulares)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- El dueño de este cliente (e.g. Grúas La Fundición)
    name TEXT NOT NULL,         -- Ej: 'Axa Seguros'
    rfc TEXT,                   -- Ej: 'AXA...''
    contact_info TEXT,          -- Email o teléfono
    address TEXT,
    logo TEXT,                  -- Base64 o URL
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own company clients" ON public.clients
    FOR ALL USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

-- 2. Tabla de Tarifas (Matriz de Precios)
-- Cada cliente tiene precios personalizados para cada servicio.
CREATE TABLE IF NOT EXISTS public.client_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- Ej: 'tow', 'jump', 'tire'
    
    -- Costos Base
    base_rate NUMERIC(10,2) DEFAULT 0,      -- Banderazo / Costo Fijo
    km_rate NUMERIC(10,2) DEFAULT 0,        -- Costo por KM (si aplica)
    
    -- Configuración Extra (JSONB para flexibilidad futura o columnas fijas como pidió el usuario)
    -- El usuario pidió: service_scope (local/foraneo), pero km_rate ya implica foráneo.
    -- Vamos a agregar el scope explícito.
    service_scope TEXT CHECK (service_scope IN ('local', 'foraneo')) DEFAULT 'local',
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(client_id, service_type, service_scope) -- Evita duplicados de tarifa para el mismo servicio/scope
);

-- RLS para Tariffs
ALTER TABLE public.client_tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own client tariffs" ON public.client_tariffs
    FOR ALL USING (client_id IN (
        SELECT id FROM public.clients WHERE company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    ));

-- 3. Notificación de Éxito
DO $$
BEGIN
    RAISE NOTICE 'Tablas clients y client_tariffs creadas correctamente con RLS.';
END $$;
