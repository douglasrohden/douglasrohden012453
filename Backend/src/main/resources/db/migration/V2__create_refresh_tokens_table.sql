-- Criação da tabela de refresh tokens
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índice para busca rápida por token_hash
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Índice para busca por user_id
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
