-- V10__rename_album_cover_size_to_size_bytes.sql
-- Rename column only if the old column exists, and don't error if already renamed.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'album_cover' AND column_name = 'size'
  ) THEN
    EXECUTE 'ALTER TABLE album_cover RENAME COLUMN "size" TO size_bytes';
  END IF;
  -- Ensure target column exists; if not, create it with a sensible default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'album_cover' AND column_name = 'size_bytes'
  ) THEN
    EXECUTE 'ALTER TABLE album_cover ADD COLUMN IF NOT EXISTS size_bytes BIGINT DEFAULT 0';
  END IF;
  -- Set default (idempotent)
  EXECUTE 'ALTER TABLE album_cover ALTER COLUMN size_bytes SET DEFAULT 0';
END
$$;

-- (Opcional) se você usa NOT NULL, habilite explicitamente quando estiver seguro
-- DO $$ BEGIN IF (SELECT is_nullable FROM information_schema.columns WHERE table_name='album_cover' AND column_name='size_bytes') = 'YES' THEN EXECUTE 'ALTER TABLE album_cover ALTER COLUMN size_bytes SET NOT NULL'; END IF; END $$;
