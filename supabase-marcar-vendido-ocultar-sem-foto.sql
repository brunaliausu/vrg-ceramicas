-- ============================================================
-- VRG Cerâmicas — Vendido na loja + ocultar sem foto
-- Execute no Supabase: Dashboard → SQL → New query → Run
--
-- 1) Produtos SEM foto → Rascunho (some da loja; cadastro admin intacto)
-- 2) Produtos COM foto ainda visíveis → Vendido
-- 3) Peças/conjuntos publicados com foto → status vendido no admin
-- ============================================================

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

-- Prévia (opcional):
-- SELECT id, nome, status FROM produtos WHERE status <> 'Rascunho' ORDER BY nome;

-- 1) Ocultar da vitrine: sem foto (não mexe em pecas_estoque / conjuntos)
UPDATE public.produtos
SET
  status = 'Rascunho',
  destaque_home = false,
  atualizado_em = now()
WHERE status <> 'Rascunho'
  AND NOT public.vrg_tem_foto_valida(imagens);

-- 2) Loja: com foto → Vendido
UPDATE public.produtos
SET
  status = 'Vendido',
  destaque_home = false,
  atualizado_em = now()
WHERE status <> 'Rascunho'
  AND public.vrg_tem_foto_valida(imagens);

-- 3) Admin: peças avulsas publicadas com foto
UPDATE public.pecas_estoque
SET
  status = 'vendido',
  vendido_em = COALESCE(vendido_em, now()),
  atualizado_em = now()
WHERE conjunto_id IS NULL
  AND exibir_no_site = true
  AND public.vrg_tem_foto_valida(fotos)
  AND COALESCE(status, '') <> 'vendido';

-- 4) Admin: conjuntos publicados com foto
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'conjuntos'
  ) THEN
    UPDATE public.conjuntos
    SET status = 'vendido'
    WHERE exibir_no_site = true
      AND public.vrg_tem_foto_valida(fotos)
      AND COALESCE(status, '') <> 'vendido';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
