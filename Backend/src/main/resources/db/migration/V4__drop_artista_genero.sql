-- Remove the 'genero' column from artista
ALTER TABLE artista DROP COLUMN genero;

-- If using databases that require cascade or don't allow drop when constraints exist, adjust accordingly.
