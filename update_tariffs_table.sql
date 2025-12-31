-- MIGRATION: Add pricing_matrix JSONB column to client_tariffs
ALTER TABLE public.client_tariffs
ADD COLUMN IF NOT EXISTS pricing_matrix JSONB DEFAULT '{}'::jsonb;

-- Comment to document purpose
COMMENT ON COLUMN public.client_tariffs.pricing_matrix IS 'Stores complex pricing structures (flexible fields) for specific service types.';
