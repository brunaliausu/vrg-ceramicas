-- Corrige RLS da tabela conjunto_pecas (erro ao salvar conjunto com peça vinculada).
-- Execute no SQL Editor do Supabase: Dashboard → SQL → New query → Run
-- Requer supabase-security.sql já executado (função public.is_admin()).

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

NOTIFY pgrst, 'reload schema';
