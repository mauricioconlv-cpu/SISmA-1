-- ⚠️ ADVERTENCIA: ESTE SCRIPT BORRARÁ TODOS LOS SERVICIOS Y REPORTES DEL SISTEMA ⚠️
-- No afectará a Clientes (Aseguradoras), Usuarios ni Inventario de Vehículos (Grúas).

BEGIN;

-- 1. Limpieza profunda de la tabla operativa principal
-- CASCADE asegurará que si existen tablas hijas (service_photos, checkpoints, etc.) 
-- también se limpien automáticamente, evitando errores de Foreign Key.
TRUNCATE TABLE public.services RESTART IDENTITY CASCADE;

-- 2. Confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Limpieza completada: Todos los servicios han sido eliminados. Clientes y Usuarios permanecen intactos.';
END $$;

COMMIT;
