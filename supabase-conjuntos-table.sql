-- Migração: tabela dedicada para conjuntos de peças
-- Execute no Supabase SQL Editor APÓS supabase-conjuntos-migration.sql

CREATE TABLE IF NOT EXISTS conjuntos (
  id              uuid        PRIMARY KEY,
  codigo          text,
  nome            text,
  descricao       text,
  status          text,
  exibir_no_site  boolean     NOT NULL DEFAULT false,
  fenearte        boolean     NOT NULL DEFAULT false,
  categoria       text,
  fotos           text[]      NOT NULL DEFAULT '{}'::text[],
  criado_em       timestamptz NOT NULL DEFAULT now()
);

-- Migrar conjuntos já existentes nas peças para a nova tabela
INSERT INTO conjuntos (id, codigo, nome)
SELECT DISTINCT conjunto_id, conjunto_codigo, conjunto_nome
FROM   pecas_estoque
WHERE  conjunto_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;
