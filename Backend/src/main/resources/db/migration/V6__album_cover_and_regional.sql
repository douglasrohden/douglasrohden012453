-- Migration V7: create image tables (Portuguese), regional, and artista_album

-- 1) Album Imagem
CREATE TABLE IF NOT EXISTS album_imagem (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  album_id BIGINT NOT NULL,
  object_key VARCHAR(1024) NOT NULL,
  content_type VARCHAR(255),
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_album_imagem_album
    FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_album_imagem_album_id ON album_imagem(album_id);
CREATE INDEX IF NOT EXISTS idx_album_imagem_object_key ON album_imagem(object_key);

-- 2) Artista Imagem
CREATE TABLE IF NOT EXISTS artista_imagem (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  artista_id BIGINT NOT NULL,
  object_key VARCHAR(1024) NOT NULL,
  content_type VARCHAR(255),
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artista_imagem_artista
    FOREIGN KEY (artista_id) REFERENCES artista(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artista_imagem_artista_id ON artista_imagem(artista_id);
CREATE INDEX IF NOT EXISTS idx_artista_imagem_object_key ON artista_imagem(object_key);

-- 3) Regional
CREATE TABLE IF NOT EXISTS regional (
  id INTEGER PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4) Join table artista_album
CREATE TABLE IF NOT EXISTS artista_album (
  artista_id BIGINT NOT NULL,
  album_id BIGINT NOT NULL,
  CONSTRAINT pk_artista_album PRIMARY KEY (artista_id, album_id),
  CONSTRAINT fk_artista_album_artista
    FOREIGN KEY (artista_id) REFERENCES artista(id) ON DELETE CASCADE,
  CONSTRAINT fk_artista_album_album
    FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artista_album_artista_id ON artista_album(artista_id);
CREATE INDEX IF NOT EXISTS idx_artista_album_album_id ON artista_album(album_id);
