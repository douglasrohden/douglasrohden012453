

-- 2) Se a tabela já existia com coluna 'active', renomear para 'ativo'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'regional'
      AND column_name = 'active'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'regional'
      AND column_name = 'ativo'
  ) THEN
    ALTER TABLE regional RENAME COLUMN active TO ativo;
  END IF;
END $$;

-- 3) Garantir tamanho/colunas mínimas (idempotente)
ALTER TABLE regional ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
ALTER TABLE regional ADD COLUMN IF NOT EXISTS nome VARCHAR(200);
ALTER TABLE regional ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE regional ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE regional ADD COLUMN IF NOT EXISTS inactivated_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE regional ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_regional_external_id ON regional(external_id);

-- Recria índice único parcial (mantém apenas um registro ativo por external_id)
DROP INDEX IF EXISTS uq_regional_external_id_active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_regional_external_id_active ON regional (external_id) WHERE ativo;
