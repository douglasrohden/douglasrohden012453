-- Migration V7: create album_cover, regional with historization, and ensure artista_album join table exists
-- Note: partial unique index for active regional is Postgres-specific (CREATE UNIQUE INDEX ... WHERE active)

CREATE TABLE IF NOT EXISTS album_cover (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  album_id BIGINT NOT NULL,
  object_key VARCHAR(1024) NOT NULL,
  content_type VARCHAR(255),
  size BIGINT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_album_cover_album FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_cover_album_id ON album_cover(album_id);

-- Alter table regional to support historization (external_id + auto PK)
-- First, backup existing data if any
CREATE TEMP TABLE regional_backup AS SELECT * FROM regional;

-- Drop existing table and recreate with new schema
DROP TABLE IF EXISTS regional;

CREATE TABLE regional (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  external_id INTEGER NOT NULL,
  nome VARCHAR(200) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Restore data with external_id = old id
INSERT INTO regional (external_id, nome, ativo, created_at)
SELECT id, nome, ativo, CURRENT_TIMESTAMP FROM regional_backup;

-- Create unique index for active records by external_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_regional_external_id_active ON regional(external_id) WHERE ativo = true;

-- Create index for external_id
CREATE INDEX IF NOT EXISTS idx_regional_external_id ON regional(external_id);

-- Ensure join table exists (should already exist from JPA mapping); creating if missing
CREATE TABLE IF NOT EXISTS artista_album (
  artista_id BIGINT NOT NULL,
  album_id BIGINT NOT NULL,
  CONSTRAINT pk_artista_album PRIMARY KEY (artista_id, album_id),
  CONSTRAINT fk_artista_album_artista FOREIGN KEY (artista_id) REFERENCES artista(id) ON DELETE CASCADE,
  CONSTRAINT fk_artista_album_album FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artista_album_artista_id ON artista_album(artista_id);
CREATE INDEX IF NOT EXISTS idx_artista_album_album_id ON artista_album(album_id);
