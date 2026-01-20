CREATE TABLE artista (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    genero VARCHAR(255),
    image_url VARCHAR(500)
);

INSERT INTO artista (nome, genero, image_url) VALUES
('Serj Tankian', 'Alternative Metal', 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb'),
('Mike Shinoda', 'Hip Hop, Rock', 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6db6d3'),
('Michel Teló', 'Sertanejo', 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0'),
('Guns N’ Roses', 'Hard Rock', 'https://i.scdn.co/image/ab6761610000e5eb249d55f2d68a44637905c57e');
