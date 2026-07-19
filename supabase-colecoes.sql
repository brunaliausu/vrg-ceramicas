-- ============================================================
-- VRG Cerâmicas — Coleções (admin ↔ site)
-- Execute no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.colecoes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text        NOT NULL,
  slug            text        NOT NULL UNIQUE,
  exibir_no_site  boolean     NOT NULL DEFAULT false,
  site_lead       text        NOT NULL DEFAULT 'Coleção',
  site_titulo     text        NOT NULL DEFAULT '',
  site_texto      text        NOT NULL DEFAULT '',
  site_imagem     text        NOT NULL DEFAULT '',
  ordem           integer     NOT NULL DEFAULT 0,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pecas_estoque
  ADD COLUMN IF NOT EXISTS colecao_id uuid REFERENCES public.colecoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pecas_colecao_id ON public.pecas_estoque (colecao_id);
CREATE INDEX IF NOT EXISTS idx_colecoes_site ON public.colecoes (exibir_no_site, ordem);

-- Migrar nomes já usados na loja
INSERT INTO public.colecoes (nome, slug, site_titulo, site_lead, ordem)
SELECT DISTINCT
  btrim(colecao),
  lower(regexp_replace(btrim(colecao), '[^a-zA-Z0-9]+', '-', 'g')),
  btrim(colecao),
  'Coleção',
  0
FROM public.produtos
WHERE colecao IS NOT NULL AND btrim(colecao) <> ''
ON CONFLICT (slug) DO NOTHING;

-- Coleção Seres (se ainda não existir)
INSERT INTO public.colecoes (nome, slug, site_titulo, site_lead, ordem)
VALUES ('Seres', 'seres', 'Seres', 'Coleção', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.colecoes (nome, slug, site_titulo, site_lead, ordem)
VALUES ('Flor de Lis', 'flor-de-lis', 'Flor de Lis', 'Coleção de lançamento', 2)
ON CONFLICT (slug) DO NOTHING;

-- Vincular peças publicadas que já tinham colecao na loja
UPDATE public.pecas_estoque p
SET colecao_id = c.id
FROM public.produtos pr
JOIN public.colecoes c ON lower(btrim(c.nome)) = lower(btrim(pr.colecao))
WHERE pr.id = p.id
  AND p.colecao_id IS NULL
  AND pr.colecao IS NOT NULL;

ALTER TABLE public.colecoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colecoes_public_read" ON public.colecoes;
CREATE POLICY "colecoes_public_read"
  ON public.colecoes FOR SELECT
  TO anon, authenticated
  USING (exibir_no_site = true);

DROP POLICY IF EXISTS "colecoes_admin_all" ON public.colecoes;
CREATE POLICY "colecoes_admin_all"
  ON public.colecoes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
