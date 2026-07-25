-- ============================================================
-- VRG Cerâmicas — Leitura pública das imagens (bucket produtos)
-- Execute no SQL Editor do Supabase se imagens não abrirem no site.
-- ============================================================

DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;

CREATE POLICY "Imagens públicas"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'produtos');

NOTIFY pgrst, 'reload schema';
