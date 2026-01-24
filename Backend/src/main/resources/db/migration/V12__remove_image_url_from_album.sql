-- Remove a coluna image_url da tabela album
ALTER TABLE album DROP COLUMN IF EXISTS image_url;
-- Remover índices/constraints vinculados à coluna (se existirem)
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN SELECT indexname FROM pg_indexes WHERE tablename = 'album' AND indexdef ILIKE '%image_url%' LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || idx.indexname;
    END LOOP;
END$$;
