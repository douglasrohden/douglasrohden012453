-- 1) Novas colunas para rotação/invalidação
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS replaced_by_token_hash VARCHAR(64);

-- 2) Ajuste de domínio do hash (64 chars)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'refresh_tokens'
      AND column_name = 'token_hash'
      AND data_type = 'character varying'
      AND character_maximum_length IS DISTINCT FROM 64
  ) THEN
    -- Atenção: isso falha se existir valor > 64.
    ALTER TABLE refresh_tokens ALTER COLUMN token_hash TYPE VARCHAR(64);
  END IF;
END $$;

-- 3) Timezone: converter para TIMESTAMPTZ somente se era "timestamp sem timezone"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'refresh_tokens'
      AND column_name = 'expires_at'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE refresh_tokens
      ALTER COLUMN expires_at TYPE TIMESTAMPTZ
      USING expires_at AT TIME ZONE current_setting('TimeZone');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'refresh_tokens'
      AND column_name = 'created_at'
      AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE refresh_tokens
      ALTER COLUMN created_at TYPE TIMESTAMPTZ
      USING created_at AT TIME ZONE current_setting('TimeZone');
  END IF;
END $$;

-- 4) Índices
DROP INDEX IF EXISTS idx_refresh_tokens_token_hash;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
  ON refresh_tokens(user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id_revoked_at
  ON refresh_tokens(user_id, revoked_at);
