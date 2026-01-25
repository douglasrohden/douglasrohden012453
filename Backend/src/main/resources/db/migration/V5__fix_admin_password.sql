-- Ensure the seeded admin user can log in with password 'admin'
-- Some earlier setups may have a mismatched hash.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Inserir usuário padrão para testes
-- Username: admin
-- Password: admin (hash BCrypt gerado para 'admin')
INSERT INTO usuarios (username, password_hash, created_at, updated_at) 
VALUES ('admin', '$2a$10$LIqJxdaXGYfvIOIGxNLUe.rGKBUxjUQtUtgY0gLAG.s9/E2KCMsdC', NOW(), NOW());

