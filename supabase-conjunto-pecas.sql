-- ============================================================
-- VRG Cerâmicas — Peça pode pertencer a vários conjuntos
-- Execute no SQL Editor do Supabase (produção e dev).
-- ============================================================

CREATE TABLE IF NOT EXISTS conjunto_pecas (
  conjunto_id uuid NOT NULL,
  peca_id     uuid NOT NULL,
  ordem       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (conjunto_id, peca_id)
);

CREATE INDEX IF NOT EXISTS idx_conjunto_pecas_peca ON conjunto_pecas (peca_id);
CREATE INDEX IF NOT EXISTS idx_conjunto_pecas_conjunto ON conjunto_pecas (conjunto_id);

-- Migrar vínculos existentes (conjunto_id na peça)
INSERT INTO conjunto_pecas (conjunto_id, peca_id, ordem)
SELECT conjunto_id, id, COALESCE(ordem, 0)
FROM pecas_estoque
WHERE conjunto_id IS NOT NULL
ON CONFLICT (conjunto_id, peca_id) DO NOTHING;

ALTER TABLE conjunto_pecas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conjunto_pecas_public_read" ON conjunto_pecas;
CREATE POLICY "conjunto_pecas_public_read"
  ON conjunto_pecas FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "conjunto_pecas_admin_all" ON conjunto_pecas;
CREATE POLICY "conjunto_pecas_admin_all"
  ON conjunto_pecas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
