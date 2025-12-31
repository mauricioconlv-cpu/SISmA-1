-- Migration to fix client_tariffs constraints
-- This allows the new 'flexible' service_scope used by the JSONB pricing matrix

-- 1. Drop the legacy check constraint that forced 'local' or 'foreign'
ALTER TABLE public.client_tariffs 
DROP CONSTRAINT IF EXISTS client_tariffs_service_scope_check;

-- 2. Make service_scope nullable (optional, but requested for flexibility)
ALTER TABLE public.client_tariffs 
ALTER COLUMN service_scope DROP NOT NULL;

-- 3. (Optional) Add a new check constraint if you want to restrict values including 'flexible'
-- ALTER TABLE public.client_tariffs 
-- ADD CONSTRAINT client_tariffs_service_scope_check 
-- CHECK (service_scope IN ('local', 'foreign', 'flexible'));
