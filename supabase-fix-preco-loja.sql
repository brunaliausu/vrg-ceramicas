-- ============================================================
-- VRG Cerâmicas — Corrigir preços na loja (preço praticado)
-- Execute no SQL Editor do Supabase (produção).
-- Atualiza produtos já publicados para usar preco_praticado.
-- ============================================================

-- Peças avulsas publicadas no site
UPDATE public.produtos pr
SET preco = COALESCE(NULLIF(pe.preco_praticado, 0), NULLIF(pe.preco_venda, 0))
FROM public.pecas_estoque pe
WHERE pr.id = pe.id
  AND pe.exibir_no_site = true
  AND COALESCE(NULLIF(pe.preco_praticado, 0), NULLIF(pe.preco_venda, 0)) IS NOT NULL;

-- Conjuntos publicados no site
UPDATE public.produtos pr
SET preco = COALESCE(NULLIF(c.preco_praticado, 0), NULLIF(c.preco_venda, 0))
FROM public.conjuntos c
WHERE pr.id = c.id
  AND c.exibir_no_site = true
  AND COALESCE(NULLIF(c.preco_praticado, 0), NULLIF(c.preco_venda, 0)) IS NOT NULL;

NOTIFY pgrst, 'reload schema';
