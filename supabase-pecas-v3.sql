-- ============================================================
-- VRG Cerâmicas — Migração: pecas_estoque v3
-- Adiciona colunas de esmalte, engobe, tinta, queimas e preço.
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS esmalte_qnt_gr   numeric(10, 4),
  ADD COLUMN IF NOT EXISTS engobe_qnt_gr    numeric(10, 4),
  ADD COLUMN IF NOT EXISTS tinta_qnt_gr     numeric(10, 4),
  ADD COLUMN IF NOT EXISTS tipo_biscoito    text,
  ADD COLUMN IF NOT EXISTS tipo_queima      text,
  ADD COLUMN IF NOT EXISTS custo_extra      numeric(10, 2),
  ADD COLUMN IF NOT EXISTS preco_praticado  numeric(10, 2);
