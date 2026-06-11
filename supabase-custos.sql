-- ─── Tabela: custos_config ────────────────────────────────────────────────────
-- Armazena toda a configuração de custos e precificação em uma única linha JSONB.
-- Execute este script no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS custos_config (
  id            integer PRIMARY KEY DEFAULT 1,
  dados         jsonb   NOT NULL DEFAULT '{}',
  atualizado_em timestamptz DEFAULT now(),
  CONSTRAINT custos_config_single_row CHECK (id = 1)
);

-- Linha padrão (cria se ainda não existir)
INSERT INTO custos_config (id, dados)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE custos_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública"
  ON custos_config FOR SELECT USING (true);

CREATE POLICY "Escrita autenticada"
  ON custos_config FOR ALL USING (auth.role() = 'authenticated');
