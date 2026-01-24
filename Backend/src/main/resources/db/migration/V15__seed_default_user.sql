-- Inserir usuário padrão para testes
-- Username: admin
-- Password: admin (hash BCrypt gerado para 'admin')
INSERT INTO usuarios (username, password_hash, created_at, updated_at) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW());
