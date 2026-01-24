CREATE TABLE artista (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    genero VARCHAR(255)
);
 
INSERT INTO artista (nome, genero) VALUES
('Serj Tankian', 'Alternative Metal'),
('Mike Shinoda', 'Hip Hop, Rock'),
('Michel Teló', 'Sertanejo'),
('Guns N’ Roses', 'Hard Rock');
