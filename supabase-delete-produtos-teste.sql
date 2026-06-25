-- Exclusão segura de produtos cadastrados em testes (identificados por ID exato).
-- Executar no SQL Editor do Supabase (Dashboard → SQL → New query).
--
-- Passo 1: conferir que são exatamente estas 6 peças antes de deletar.
SELECT id, nome, categoria, status, slug
FROM public.produtos
WHERE id IN (
  '312218b8-b4e5-4eb6-9560-07006a7e6260', -- Petisqueira Borboleta (Utilitários)
  'f0303720-b188-4532-aaed-9ea39a6a1fe6', -- Vaso (Utilitários)
  '0e386aad-bc29-40bb-8c38-0e9f0d386bc6', -- Flor de Lis (Decorativos)
  '519151e2-893c-47d4-a482-c17b8df45f54', -- O voo do pássaro (Utilitários)
  '7c44dfc9-b7e2-4dd4-8991-f6a17e5890e7', -- Borboleta (Utilitários)
  '1647fcdc-673a-4a4a-b0af-d9f74a0f9c55'  -- teste (Utilitários, vendido)
)
ORDER BY nome;

-- Passo 2: se o SELECT acima retornar exatamente 6 linhas com os nomes corretos, executar:
DELETE FROM public.produtos
WHERE id IN (
  '312218b8-b4e5-4eb6-9560-07006a7e6260',
  'f0303720-b188-4532-aaed-9ea39a6a1fe6',
  '0e386aad-bc29-40bb-8c38-0e9f0d386bc6',
  '519151e2-893c-47d4-a482-c17b8df45f54',
  '7c44dfc9-b7e2-4dd4-8991-f6a17e5890e7',
  '1647fcdc-673a-4a4a-b0af-d9f74a0f9c55'
);
