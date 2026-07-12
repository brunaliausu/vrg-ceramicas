-- ============================================================
-- VRG Cerâmicas — Ocultar da loja itens publicados SEM foto
-- NÃO exclui peças/conjuntos do estoque (pecas_estoque / conjuntos).
-- Execute no Supabase: Dashboard → SQL → New query → Run
-- ============================================================

-- Colunas usadas pelo admin (seguro rodar de novo)
ALTER TABLE public.pecas_estoque
  ADD COLUMN IF NOT EXISTS exibir_no_site boolean NOT NULL DEFAULT false;

ALTER TABLE public.pecas_estoque
  ADD COLUMN IF NOT EXISTS destaque_home boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conjuntos'
  ) THEN
    ALTER TABLE public.conjuntos
      ADD COLUMN IF NOT EXISTS exibir_no_site boolean NOT NULL DEFAULT false;
    ALTER TABLE public.conjuntos
      ADD COLUMN IF NOT EXISTS destaque_home boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Verifica se há URL não vazia no array de fotos/imagens
CREATE OR REPLACE FUNCTION public.vrg_tem_foto_valida(arr text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(arr, ARRAY[]::text[])) AS t(url)
    WHERE length(btrim(COALESCE(url, ''))) > 0
  );
$$;

-- ── Prévia (opcional): descomente para ver o que será afetado ────────────────
-- SELECT id, codigo, nome FROM pecas_estoque
-- WHERE conjunto_id IS NULL AND exibir_no_site = true
--   AND NOT public.vrg_tem_foto_valida(fotos);
--
-- SELECT id, codigo, nome FROM conjuntos
-- WHERE exibir_no_site = true AND NOT public.vrg_tem_foto_valida(fotos);
--
-- SELECT id, nome, status FROM produtos
-- WHERE status <> 'Rascunho' AND NOT public.vrg_tem_foto_valida(imagens);

-- 1) Peças avulsas: desmarcar exibir no site
UPDATE public.pecas_estoque
SET
  exibir_no_site = false,
  destaque_home = false,
  atualizado_em = now()
WHERE conjunto_id IS NULL
  AND exibir_no_site = true
  AND NOT public.vrg_tem_foto_valida(fotos);

-- 2) Conjuntos publicados sem foto
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conjuntos'
  ) THEN
    UPDATE public.conjuntos
    SET
      exibir_no_site = false,
      destaque_home = false
    WHERE exibir_no_site = true
      AND NOT public.vrg_tem_foto_valida(fotos);
  END IF;
END $$;

-- 3) Vitrine pública: produtos visíveis sem imagem → Rascunho
UPDATE public.produtos
SET
  status = 'Rascunho',
  destaque_home = false,
  atualizado_em = now()
WHERE status <> 'Rascunho'
  AND NOT public.vrg_tem_foto_valida(imagens);

NOTIFY pgrst, 'reload schema';
