-- ACTUALIZACIÓN DE PERMISOS RLS PARA CLIENT TARIFFS
-- Este script agrega una política para permitir a los Super Admins gestionar tarifas globalmente.

-- 1. Política para 'superadmin'
-- Permite SELECT, INSERT, UPDATE, DELETE basándose en el rol del usuario en la tabla profiles.
CREATE POLICY "Superadmin can manage all client tariffs" ON public.client_tariffs
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'superadmin'
        )
    );

-- Nota:
-- Al usar FOR ALL y proveer solo la cláusula USING, PostgreSQL aplica automáticamente
-- la misma condición para la cláusula WITH CHECK (usada en INSERT y UPDATE de nuevas filas).
-- Dado que la validación solo depende del ID del usuario y su rol (y no de los datos de la fila),
-- esto cubre correctamente todos los casos.

DO $$
BEGIN
    RAISE NOTICE 'Política RLS para Superadmin en client_tariffs creada correctamente.';
END $$;
