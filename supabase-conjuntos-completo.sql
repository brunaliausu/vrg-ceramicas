-- ============================================================
-- VRG Cerâmicas — Conjuntos (migração completa)
-- Execute UMA VEZ no SQL Editor do Supabase:
-- https://supabase.com/dashboard → seu projeto → SQL → New query
-- ============================================================

-- 1) Colunas de conjunto em pecas_estoque
ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS conjunto_id    uuid,
  ADD COLUMN IF NOT EXISTS conjunto_codigo text,
  ADD COLUMN IF NOT EXISTS conjunto_nome   text,
  ADD COLUMN IF NOT EXISTS destaque_home   boolean NOT NULL DEFAULT false;

ALTER TABLE conjuntos
  ADD COLUMN IF NOT EXISTS destaque_home boolean NOT NULL DEFAULT false;

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS margem_venda    numeric(5, 2) NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS preco_venda     numeric(10, 2),
  ADD COLUMN IF NOT EXISTS preco_praticado numeric(10, 2);

ALTER TABLE conjuntos
  ADD COLUMN IF NOT EXISTS margem_venda   numeric(5, 2) NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS preco_venda    numeric(10, 2),
  ADD COLUMN IF NOT EXISTS preco_praticado numeric(10, 2);

-- Modo de venda: apenas conjunto completo ou também peças avulsas
ALTER TABLE conjuntos
  ADD COLUMN IF NOT EXISTS venda_modo text NOT NULL DEFAULT 'apenas_conjunto'
    CHECK (venda_modo IN ('apenas_conjunto', 'conjunto_e_pecas'));

CREATE INDEX IF NOT EXISTS idx_pecas_conjunto_id ON pecas_estoque (conjunto_id);

-- Peças em conjunto podem ficar sem status individual (gerenciado na linha do conjunto)
ALTER TABLE pecas_estoque
  ALTER COLUMN status DROP NOT NULL;

-- 2) Tabela conjuntos (dados publicados na loja ficam aqui)
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

-- 3) Migrar conjuntos já referenciados nas peças
INSERT INTO conjuntos (id, codigo, nome)
SELECT DISTINCT conjunto_id, conjunto_codigo, conjunto_nome
FROM   pecas_estoque
WHERE  conjunto_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 4) Permissões (RLS) — sem isso o app não consegue salvar
ALTER TABLE conjuntos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conjuntos_public_read" ON conjuntos;
CREATE POLICY "conjuntos_admin_all"
  ON conjuntos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "conjuntos_public_read"
  ON conjuntos FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos p
      WHERE p.id = conjuntos.id AND p.status != 'Rascunho'
    )
  );

DROP POLICY IF EXISTS "conjuntos_admin_write" ON conjuntos;

-- Recarrega o cache de schema do PostgREST (Supabase API)
NOTIFY pgrst, 'reload schema';
