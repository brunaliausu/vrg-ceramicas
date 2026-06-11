-- ============================================================
-- VRG Cerâmicas — Migração: pecas_estoque v5
-- Adiciona peso e categoria (necessários para sincronizar com
-- a tabela produtos da loja pública).
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS peso      numeric(10, 3),   -- em gramas
  ADD COLUMN IF NOT EXISTS categoria text;
