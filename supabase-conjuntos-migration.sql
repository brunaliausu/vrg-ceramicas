-- Migração: suporte a conjuntos de peças
-- Execute no Supabase SQL Editor

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS conjunto_id   uuid,
  ADD COLUMN IF NOT EXISTS conjunto_codigo text,
  ADD COLUMN IF NOT EXISTS conjunto_nome   text;

CREATE INDEX IF NOT EXISTS idx_pecas_conjunto_id ON pecas_estoque (conjunto_id);
