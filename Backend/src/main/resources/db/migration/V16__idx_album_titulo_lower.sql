-- Index para acelerar buscas case-insensitive por título de álbum

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_album_titulo_lower'
    ) THEN
        EXECUTE 'CREATE INDEX idx_album_titulo_lower ON album (LOWER(titulo));';
    END IF;
END
$$;
