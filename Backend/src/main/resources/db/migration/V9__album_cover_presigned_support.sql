-- Ensure album_cover schema aligned with storage requirements

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'album_cover'
          AND column_name = 'size'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'album_cover'
          AND column_name = 'size_bytes'
    ) THEN
        EXECUTE 'ALTER TABLE album_cover RENAME COLUMN "size" TO size_bytes';
    END IF;
END
$$;

ALTER TABLE IF EXISTS album_cover
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN object_key SET NOT NULL,
    ALTER COLUMN album_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_album_cover_object_key ON album_cover(object_key);
