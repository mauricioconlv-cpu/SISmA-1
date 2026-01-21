Z-- PASO 1: SISTEMA DE ROLES INTERNOS (Internal RBAC)
-- Ejecuta este script para habilitar la distinción Dueño vs Operador.

-- 1. Agregar columna 'role' a la tabla 'profiles' (si no existe)
-- Nota: Usamos TEXT con Check Constraint para simular un ENUM simple.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'operator';
        ALTER TABLE public.profiles ADD CONSTRAINT check_valid_role CHECK (role IN ('owner', 'operator', 'superadmin', 'admin'));
        RAISE NOTICE 'Columna role agregada a profiles.';
    ELSE
        RAISE NOTICE 'La columna role ya existe.';
    END IF;
END $$;

-- 2. Asegurar que los perfiles existen para los usuarios clave (si no se crearon antes)
-- Esto es por seguridad, normalmente ya deberían existir si han hecho login.

-- 3. ASIGNAR ROLES
-- A. Asignar 'owner' a Grúas La Fundición
UPDATE public.profiles
SET role = 'owner'
WHERE email = 'gruaslafundicion@gmail.com';

-- B. Asignar 'owner' a Admin base (si existe)
UPDATE public.profiles
SET role = 'owner'
WHERE email = 'admin@gruas.com';

-- C. Asignar 'superadmin' a tu usuario personal
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = 'mauricioconlv@gmail.com';

-- 4. Verificación
SELECT email, role, id FROM public.profiles WHERE email IN ('gruaslafundicion@gmail.com', 'mauricioconlv@gmail.com');
