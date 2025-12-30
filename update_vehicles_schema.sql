-- Actualización de la tabla vehicles para soportar el formulario avanzado
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS crane_type TEXT,
ADD COLUMN IF NOT EXISTS additional_tools JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS typification TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS economic_number TEXT,
ADD COLUMN IF NOT EXISTS is_federal BOOLEAN DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN public.vehicles.additional_tools IS 'Array of strings: Go-jacks, Patines, Dollys, Jumper';
