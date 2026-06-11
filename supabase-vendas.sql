-- ============================================================
-- VRG Cerâmicas — Dados de venda (peças vendidas)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS valor_venda      numeric(10, 2),
  ADD COLUMN IF NOT EXISTS local_venda      text,
  ADD COLUMN IF NOT EXISTS cliente_nome     text,
  ADD COLUMN IF NOT EXISTS cliente_telefone text,
  ADD COLUMN IF NOT EXISTS cliente_email    text,
  ADD COLUMN IF NOT EXISTS vendido_em       timestamptz;

CREATE INDEX IF NOT EXISTS idx_pecas_vendido_em ON pecas_estoque (vendido_em DESC NULLS LAST)
  WHERE status = 'vendido';

NOTIFY pgrst, 'reload schema';
