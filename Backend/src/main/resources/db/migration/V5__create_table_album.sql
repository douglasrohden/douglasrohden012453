CREATE TABLE album (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    ano INTEGER
);

-- Tabela de associação N:N entre artista e álbum
CREATE TABLE artista_album (
    artista_id INTEGER NOT NULL REFERENCES artista(id) ON DELETE CASCADE,
    album_id INTEGER NOT NULL REFERENCES album(id) ON DELETE CASCADE,
    PRIMARY KEY (artista_id, album_id)
);

-- Seed dos álbuns e associações conforme edital
INSERT INTO album (titulo, ano) VALUES
('Harakiri', 2012),
('Black Blooms', 2019),
('The Rough Dog', 2021),
('The Rising Tied', 2005),
('Post Traumatic', 2018),
('Post Traumatic EP', 2018),
('Where’d You Go', 2006),
('Bem Sertanejo', 2014),
('Bem Sertanejo - O Show (Ao Vivo)', 2015),
('Bem Sertanejo - (1ª Temporada) - EP', 2014),
('Use Your Illusion I', 1991),
('Use Your Illusion II', 1991),
('Greatest Hits', 2004);

-- Associações artista_album
-- Serj Tankian: 1,2,3
INSERT INTO artista_album (artista_id, album_id) VALUES (1, 1), (1, 2), (1, 3);
-- Mike Shinoda: 4,5,6,7
INSERT INTO artista_album (artista_id, album_id) VALUES (2, 4), (2, 5), (2, 6), (2, 7);
-- Michel Teló: 8,9,10
INSERT INTO artista_album (artista_id, album_id) VALUES (3, 8), (3, 9), (3, 10);
-- Guns N’ Roses: 11,12,13
INSERT INTO artista_album (artista_id, album_id) VALUES (4, 11), (4, 12), (4, 13);
