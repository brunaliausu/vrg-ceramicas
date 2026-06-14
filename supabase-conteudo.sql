-- ============================================================
-- VRG Cerâmicas — Migração: Conteúdo do Site
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- Tabela de conteúdo editável via /admin/conteudo
CREATE TABLE IF NOT EXISTS conteudo_site (
  id TEXT PRIMARY KEY,            -- 'home' | 'sobre' | 'processo' | 'contato' | 'produto_historia'
  dados JSONB NOT NULL DEFAULT '{}',
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Linhas iniciais com conteúdo em branco (os defaults vêm do código)
INSERT INTO conteudo_site (id, dados) VALUES
  ('home',             '{}'),
  ('sobre',            '{}'),
  ('processo',         '{}'),
  ('contato',          '{}'),
  ('produto_historia', '{}')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE conteudo_site ENABLE ROW LEVEL SECURITY;

-- Leitura pública (site público lê sem autenticação)
CREATE POLICY "conteudo_site_public_read"
  ON conteudo_site FOR SELECT
  USING (true);

-- Escrita apenas para admin
CREATE POLICY "conteudo_site_admin_insert"
  ON conteudo_site FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "conteudo_site_admin_update"
  ON conteudo_site FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "conteudo_site_admin_delete"
  ON conteudo_site FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- Bucket para imagens do conteúdo do site
-- (usa o mesmo bucket 'produtos' já existente; imagens de
--  conteúdo são salvas no caminho conteudo/<nome-do-arquivo>)
-- Nenhuma ação SQL necessária aqui — o bucket já existe.
-- ============================================================
