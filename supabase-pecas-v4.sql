-- ============================================================
-- VRG Cerâmicas — Migração: pecas_estoque v4
-- Adiciona descrição, status e visibilidade no site.
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS descricao      text,
  ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'disponivel',
  ADD COLUMN IF NOT EXISTS exibir_no_site boolean NOT NULL DEFAULT false;
