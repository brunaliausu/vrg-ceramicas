-- Quantidade de cada peça por conjunto (ex.: 3 unidades da mesma peça no conjunto B).
-- Execute no SQL Editor do Supabase após supabase-conjunto-pecas.sql.

ALTER TABLE public.conjunto_pecas
  ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1
    CHECK (quantidade >= 1);

NOTIFY pgrst, 'reload schema';
