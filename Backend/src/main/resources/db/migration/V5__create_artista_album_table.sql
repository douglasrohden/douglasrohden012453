-- Tabela de associação N:N entre artista e álbum
CREATE TABLE artista_album (
    artista_id BIGINT NOT NULL,
    album_id BIGINT NOT NULL,
    PRIMARY KEY (artista_id, album_id),
    CONSTRAINT fk_artista_album_artista FOREIGN KEY (artista_id) REFERENCES artista(id) ON DELETE CASCADE,
    CONSTRAINT fk_artista_album_album FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE
);

CREATE INDEX idx_artista_album_artista_id ON artista_album(artista_id);
CREATE INDEX idx_artista_album_album_id ON artista_album(album_id);

-- Associações artista_album conforme edital
-- Serj Tankian (id=1): Harakiri, Black Blooms, The Rough Dog
INSERT INTO artista_album (artista_id, album_id)
SELECT 1, id FROM album WHERE titulo IN ('Harakiri', 'Black Blooms', 'The Rough Dog')
ON CONFLICT (artista_id, album_id) DO NOTHING;

-- Mike Shinoda (id=2): The Rising Tied, Post Traumatic, Post Traumatic EP, Where'd You Go
INSERT INTO artista_album (artista_id, album_id)
SELECT 2, id FROM album WHERE titulo IN ('The Rising Tied', 'Post Traumatic', 'Post Traumatic EP', 'Where''d You Go')
ON CONFLICT (artista_id, album_id) DO NOTHING;

-- Michel Teló (id=3): Bem Sertanejo, Bem Sertanejo - O Show (Ao Vivo), Bem Sertanejo - (1ª Temporada) - EP
INSERT INTO artista_album (artista_id, album_id)
SELECT 3, id FROM album WHERE titulo IN ('Bem Sertanejo', 'Bem Sertanejo - O Show (Ao Vivo)', 'Bem Sertanejo - (1ª Temporada) - EP')
ON CONFLICT (artista_id, album_id) DO NOTHING;

-- Guns N' Roses (id=4): Use Your Illusion I, Use Your Illusion II, Greatest Hits
INSERT INTO artista_album (artista_id, album_id)
SELECT 4, id FROM album WHERE titulo IN ('Use Your Illusion I', 'Use Your Illusion II', 'Greatest Hits')
ON CONFLICT (artista_id, album_id) DO NOTHING;
