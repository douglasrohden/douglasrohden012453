-- V8: Seed completo com artistas e álbuns do edital
-- Atualiza os artistas existentes com o campo tipo (CANTOR ou BANDA)

-- Garantir que a coluna 'tipo' exista antes de atualizar valores
ALTER TABLE artista ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'CANTOR';

-- Atualizar tipos dos artistas
-- Serj Tankian = CANTOR
UPDATE artista SET tipo = 'CANTOR' WHERE nome = 'Serj Tankian';

-- Mike Shinoda = CANTOR
UPDATE artista SET tipo = 'CANTOR' WHERE nome = 'Mike Shinoda';

-- Michel Teló = CANTOR
UPDATE artista SET tipo = 'CANTOR' WHERE nome = 'Michel Teló';

-- Guns N' Roses = BANDA
UPDATE artista SET tipo = 'BANDA' WHERE nome = 'Guns N'' Roses';

-- Garantir que os álbuns estão cadastrados (caso ainda não estejam)
-- Se já existirem, o INSERT será ignorado devido à constraint UNIQUE (titulo, ano)
INSERT INTO album (titulo, ano) VALUES
('Harakiri', 2012),
('Black Blooms', 2019),
('The Rough Dog', 2021),
('The Rising Tied', 2005),
('Post Traumatic', 2018),
('Post Traumatic EP', 2018),
('Where''d You Go', 2006),
('Bem Sertanejo', 2014),
('Bem Sertanejo - O Show (Ao Vivo)', 2015),
('Bem Sertanejo - (1ª Temporada) - EP', 2014),
('Use Your Illusion I', 1991),
('Use Your Illusion II', 1991),
('Greatest Hits', 2004)
ON CONFLICT (titulo, ano) DO NOTHING;

-- Garantir associações artista_album (caso ainda não existam)
-- Serj Tankian (id=1): Harakiri, Black Blooms, The Rough Dog
INSERT INTO artista_album (artista_id, album_id)
SELECT 1, id FROM album WHERE titulo IN ('Harakiri', 'Black Blooms', 'The Rough Dog')
ON CONFLICT DO NOTHING;

-- Mike Shinoda (id=2): The Rising Tied, Post Traumatic, Post Traumatic EP, Where'd You Go
INSERT INTO artista_album (artista_id, album_id)
SELECT 2, id FROM album WHERE titulo IN ('The Rising Tied', 'Post Traumatic', 'Post Traumatic EP', 'Where''d You Go')
ON CONFLICT DO NOTHING;

-- Michel Teló (id=3): Bem Sertanejo, Bem Sertanejo - O Show (Ao Vivo), Bem Sertanejo - (1ª Temporada) - EP
INSERT INTO artista_album (artista_id, album_id)
SELECT 3, id FROM album WHERE titulo IN ('Bem Sertanejo', 'Bem Sertanejo - O Show (Ao Vivo)', 'Bem Sertanejo - (1ª Temporada) - EP')
ON CONFLICT DO NOTHING;

-- Guns N' Roses (id=4): Use Your Illusion I, Use Your Illusion II, Greatest Hits
INSERT INTO artista_album (artista_id, album_id)
SELECT 4, id FROM album WHERE titulo IN ('Use Your Illusion I', 'Use Your Illusion II', 'Greatest Hits')
ON CONFLICT DO NOTHING;
