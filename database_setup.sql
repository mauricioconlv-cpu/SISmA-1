-- PASO 1: CREACIÓN DE TABLAS Y SEMILLA DE DATOS
-- Ejecuta este script en el Editor SQL de Supabase para establecer la arquitectura real.

-- 1. Crear tabla de Empresas (si no existe)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rfc TEXT,
    address TEXT,
    email TEXT UNIQUE,
    active BOOLEAN DEFAULT true,
    logo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de Módulos (Tabla Intermedia)
CREATE TABLE IF NOT EXISTS public.company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, module_key) -- Evita duplicados
);

-- Habilitar RLS (Seguridad) - Opcional pero recomendado
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer (para que funcione el login) o ajustar según necesidad
CREATE POLICY "Public Read Modules" ON public.company_modules FOR SELECT USING (true);


-- 3. MIGRACIÓN DE DATOS (Bloque PL/pgSQL)
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- A. Buscar la empresa 'Grúas La Fundición' por email
    SELECT id INTO v_company_id FROM public.companies WHERE email = 'gruaslafundicion@gmail.com';

    -- Si no existe, CREARLA
    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (name, rfc, address, email, active)
        VALUES (
            'Grúas La Fundición',
            'GLF20230505ABC',
            'Av. Fundición 500, Monterrey, NL',
            'gruaslafundicion@gmail.com',
            true
        ) RETURNING id INTO v_company_id;
        RAISE NOTICE 'Empresa Grúas La Fundición creada con ID: %', v_company_id;
    ELSE
        RAISE NOTICE 'Empresa encontrada con ID: %', v_company_id;
    END IF;

    -- B. Insertar los Módulos Activos
    INSERT INTO public.company_modules (company_id, module_key, is_active)
    VALUES 
        (v_company_id, 'grua', true),
        (v_company_id, 'corriente', true),
        (v_company_id, 'llanta', true),
        (v_company_id, 'gasolina', true)
    ON CONFLICT (company_id, module_key) DO NOTHING;
    
    RAISE NOTICE 'Módulos insertados/verificados correctamente.';
END $$;
