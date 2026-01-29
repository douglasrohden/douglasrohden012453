-- Migration V6: create image tables (Portuguese) and regional

-- 1) Album Imagem
CREATE TABLE album_imagem (
  id BIGSERIAL PRIMARY KEY,
  album_id BIGINT NOT NULL,
  object_key VARCHAR(1024) NOT NULL,
  content_type VARCHAR(255),
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_album_imagem_album FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE
);

CREATE INDEX idx_album_imagem_album_id ON album_imagem(album_id);
CREATE INDEX idx_album_imagem_object_key ON album_imagem(object_key);

-- 2) Artista Imagem
CREATE TABLE artista_imagem (
  id BIGSERIAL PRIMARY KEY,
  artista_id BIGINT NOT NULL,
  object_key VARCHAR(1024) NOT NULL,
  content_type VARCHAR(255),
  size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_artista_imagem_artista FOREIGN KEY (artista_id) REFERENCES artista(id) ON DELETE CASCADE
);

CREATE INDEX idx_artista_imagem_artista_id ON artista_imagem(artista_id);
CREATE INDEX idx_artista_imagem_object_key ON artista_imagem(object_key);

-- 3) Regional
CREATE TABLE regional (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);
