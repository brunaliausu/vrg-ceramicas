-- ============================================================
-- VRG Cerâmicas — Atualiza categorias da tabela produtos (loja)
-- Execute no SQL Editor do Supabase (Dashboard → SQL → New query)
-- Corrige: produtos_categoria_check ao salvar peças no admin
-- ============================================================

ALTER TABLE public.produtos
  DROP CONSTRAINT IF EXISTS produtos_categoria_check;

UPDATE public.produtos SET categoria = 'Utilitários' WHERE categoria = 'Para a Mesa';
UPDATE public.produtos SET categoria = 'Decorativos' WHERE categoria IN ('Para a Casa', 'Esculturais');

ALTER TABLE public.produtos
  ADD CONSTRAINT produtos_categoria_check
  CHECK (categoria IN (
    'Utilitários',
    'Decorativos',
    'Conjuntos',
    'Utilitário/Decorativo'
  ));
