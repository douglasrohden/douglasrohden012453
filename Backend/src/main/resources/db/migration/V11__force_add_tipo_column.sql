ALTER TABLE artista
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'CANTOR';

-- Only set to BANDA for rows where tipo is still NULL (don't overwrite seeded values)
UPDATE artista SET tipo = 'BANDA' WHERE tipo IS NULL;
