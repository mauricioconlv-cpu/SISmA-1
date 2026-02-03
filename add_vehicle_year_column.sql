-- Add vehicle_year column to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER DEFAULT NULL;

DO $$
BEGIN
    RAISE NOTICE 'Columna vehicle_year agregada correctamente a la tabla services.';
END $$;
