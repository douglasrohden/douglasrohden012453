CREATE TABLE artista (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'CANTOR'
);

INSERT INTO artista (nome, tipo) VALUES
('Serj Tankian', 'CANTOR'),
('Mike Shinoda', 'CANTOR'),
('Michel Teló', 'CANTOR'),
('Guns N’ Roses', 'BANDA');
