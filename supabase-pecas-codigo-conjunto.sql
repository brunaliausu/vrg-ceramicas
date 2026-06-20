-- ============================================================
-- VRG Cerâmicas — Códigos de peças em conjunto
-- Peças vinculadas a conjunto podem repetir código;
-- peças avulsas (sem conjunto_id) permanecem únicas.
-- Conjuntos continuam únicos entre si (validação na aplicação).
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE pecas_estoque
  DROP CONSTRAINT IF EXISTS pecas_estoque_codigo_unique;

DROP INDEX IF EXISTS pecas_estoque_codigo_avulsa_unique;

CREATE UNIQUE INDEX pecas_estoque_codigo_avulsa_unique
  ON pecas_estoque (codigo)
  WHERE conjunto_id IS NULL
    AND codigo IS NOT NULL
    AND btrim(codigo) <> '';
