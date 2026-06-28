-- ============================================================
-- VRG Cerâmicas — Endurecimento de segurança (RLS + admin)
-- Execute UMA VEZ no SQL Editor do Supabase APÓS as migrações
-- ============================================================

-- 1) Função: apenas usuários com app_metadata.role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 2) Marcar usuário admin (substitua o e-mail)
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- WHERE email = 'seu-email@exemplo.com';

-- ============================================================
-- pecas_estoque
-- ============================================================
DROP POLICY IF EXISTS "pecas_estoque_public_read" ON public.pecas_estoque;
DROP POLICY IF EXISTS "pecas_estoque_admin_write" ON public.pecas_estoque;

CREATE POLICY "pecas_estoque_admin_all"
  ON public.pecas_estoque FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Site: peças de conjuntos publicados (sem PII de vendas avulsas)
CREATE POLICY "pecas_estoque_conjunto_public_read"
  ON public.pecas_estoque FOR SELECT
  TO anon, authenticated
  USING (
    conjunto_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.produtos p
      WHERE p.id = conjunto_id
        AND p.status != 'Rascunho'
    )
  );

-- ============================================================
-- custos_config — somente admin
-- ============================================================
DROP POLICY IF EXISTS "Leitura pública" ON public.custos_config;
DROP POLICY IF EXISTS "Escrita autenticada" ON public.custos_config;

CREATE POLICY "custos_config_admin_all"
  ON public.custos_config FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- conjuntos
-- ============================================================
DROP POLICY IF EXISTS "conjuntos_public_read" ON public.conjuntos;
DROP POLICY IF EXISTS "conjuntos_admin_write" ON public.conjuntos;

CREATE POLICY "conjuntos_admin_all"
  ON public.conjuntos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "conjuntos_public_read"
  ON public.conjuntos FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.produtos p
      WHERE p.id = conjuntos.id
        AND p.status != 'Rascunho'
    )
  );

-- ============================================================
-- conteudo_site
-- ============================================================
DROP POLICY IF EXISTS "conteudo_site_admin_write" ON public.conteudo_site;

CREATE POLICY "conteudo_site_admin_insert"
  ON public.conteudo_site FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "conteudo_site_admin_update"
  ON public.conteudo_site FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "conteudo_site_admin_delete"
  ON public.conteudo_site FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- produtos
-- ============================================================
DROP POLICY IF EXISTS "Admin acesso total" ON public.produtos;

CREATE POLICY "produtos_admin_all"
  ON public.produtos FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- configuracoes
-- ============================================================
DROP POLICY IF EXISTS "Admin edita configurações" ON public.configuracoes;

CREATE POLICY "configuracoes_admin_update"
  ON public.configuracoes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- conjunto_pecas (peça em vários conjuntos)
-- ============================================================
DROP POLICY IF EXISTS "conjunto_pecas_public_read" ON public.conjunto_pecas;
DROP POLICY IF EXISTS "conjunto_pecas_admin_all" ON public.conjunto_pecas;

CREATE POLICY "conjunto_pecas_public_read"
  ON public.conjunto_pecas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "conjunto_pecas_admin_all"
  ON public.conjunto_pecas FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- storage.objects (bucket produtos)
-- ============================================================
DROP POLICY IF EXISTS "Admin faz upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin atualiza imagens" ON storage.objects;
DROP POLICY IF EXISTS "Admin deleta imagens" ON storage.objects;

CREATE POLICY "storage_produtos_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND bucket_id = 'produtos');

CREATE POLICY "storage_produtos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND bucket_id = 'produtos');

CREATE POLICY "storage_produtos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (public.is_admin() AND bucket_id = 'produtos');

NOTIFY pgrst, 'reload schema';
