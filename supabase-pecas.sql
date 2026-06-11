-- ============================================================
-- VRG Cerâmicas — Tabela: pecas_estoque
-- Controle interno de peças: dimensões, custos e fotos.
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS pecas_estoque (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        text,
  nome          text,
  dimensoes     text,
  area_pintura  numeric(10, 4),   -- m²
  execucao_h    numeric(10, 4),   -- horas de execução
  fotos         text[]  NOT NULL DEFAULT '{}',  -- URLs no Supabase Storage
  ordem         integer,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS pecas_estoque_ordem_idx ON pecas_estoque (ordem NULLS LAST, criado_em DESC);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pecas_estoque_atualizado_em ON pecas_estoque;
CREATE TRIGGER pecas_estoque_atualizado_em
  BEFORE UPDATE ON pecas_estoque
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Row Level Security
ALTER TABLE pecas_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pecas_estoque_public_read"
  ON pecas_estoque FOR SELECT
  USING (true);

CREATE POLICY "pecas_estoque_admin_write"
  ON pecas_estoque FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
