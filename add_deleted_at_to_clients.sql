-- Add deleted_at column to clients table for Soft Delete
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: Index for performance if table grows large
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON public.clients(deleted_at);

DO $$
BEGIN
    RAISE NOTICE 'Columna deleted_at agregada correctamente a la tabla clients.';
END $$;
