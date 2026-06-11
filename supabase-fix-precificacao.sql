-- ============================================================
-- VRG Cerâmicas — Correção: colunas de precificação
-- Execute no SQL Editor do Supabase se aparecer erro:
-- "Could not find the 'margem_venda' column of 'pecas_estoque'"
-- https://supabase.com/dashboard → SQL → New query
-- ============================================================

-- Peças (inclui peças de conjunto)
ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS margem_venda    numeric(5, 2) NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS preco_venda     numeric(10, 2),
  ADD COLUMN IF NOT EXISTS preco_praticado numeric(10, 2),
  ADD COLUMN IF NOT EXISTS conjunto_id     uuid,
  ADD COLUMN IF NOT EXISTS conjunto_codigo text,
  ADD COLUMN IF NOT EXISTS conjunto_nome   text,
  ADD COLUMN IF NOT EXISTS destaque_home   boolean NOT NULL DEFAULT false;

-- Conjuntos
CREATE TABLE IF NOT EXISTS conjuntos (
  id              uuid        PRIMARY KEY,
  codigo          text,
  nome            text,
  descricao       text,
  status          text,
  exibir_no_site  boolean     NOT NULL DEFAULT false,
  destaque_home   boolean     NOT NULL DEFAULT false,
  fenearte        boolean     NOT NULL DEFAULT false,
  categoria       text,
  fotos           text[]      NOT NULL DEFAULT '{}'::text[],
  criado_em       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conjuntos
  ADD COLUMN IF NOT EXISTS margem_venda    numeric(5, 2) NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS preco_venda     numeric(10, 2),
  ADD COLUMN IF NOT EXISTS preco_praticado numeric(10, 2),
  ADD COLUMN IF NOT EXISTS destaque_home   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS venda_modo      text NOT NULL DEFAULT 'apenas_conjunto';

-- Constraint venda_modo (ignora se já existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'conjuntos_venda_modo_check'
  ) THEN
    ALTER TABLE conjuntos
      ADD CONSTRAINT conjuntos_venda_modo_check
      CHECK (venda_modo IN ('apenas_conjunto', 'conjunto_e_pecas'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pecas_conjunto_id ON pecas_estoque (conjunto_id);

ALTER TABLE pecas_estoque
  ALTER COLUMN status DROP NOT NULL;

ALTER TABLE conjuntos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conjuntos_public_read" ON conjuntos;
CREATE POLICY "conjuntos_public_read"
  ON conjuntos FOR SELECT USING (true);

DROP POLICY IF EXISTS "conjuntos_admin_write" ON conjuntos;
CREATE POLICY "conjuntos_admin_write"
  ON conjuntos FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Recarrega o cache de schema do PostgREST (Supabase API)
NOTIFY pgrst, 'reload schema';
