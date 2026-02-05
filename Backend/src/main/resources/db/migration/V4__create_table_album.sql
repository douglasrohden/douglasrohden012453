CREATE TABLE album (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL ,
    ano INTEGER
);

-- Seed dos álbuns conforme edital
INSERT INTO album (titulo, ano)
SELECT v.titulo, v.ano
FROM (VALUES
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
) AS v(titulo, ano)
WHERE NOT EXISTS (
    SELECT 1 FROM album a
    WHERE a.titulo = v.titulo AND a.ano IS NOT DISTINCT FROM v.ano
);
