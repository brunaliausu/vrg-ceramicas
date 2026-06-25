/** Produtos cadastrados em testes — IDs e metadados conferidos no banco de produção. */
export const PRODUTOS_TESTE_LEGADO = [
  {
    id: '312218b8-b4e5-4eb6-9560-07006a7e6260',
    nome: 'Petisqueira Borboleta',
    categoria: 'Para a Mesa',
    lojaLabel: 'Utilitários',
  },
  {
    id: 'f0303720-b188-4532-aaed-9ea39a6a1fe6',
    nome: 'Vaso ',
    categoria: 'Para a Mesa',
    lojaLabel: 'Utilitários',
  },
  {
    id: '0e386aad-bc29-40bb-8c38-0e9f0d386bc6',
    nome: 'Flor de Lis',
    categoria: 'Para a Casa',
    lojaLabel: 'Decorativos',
  },
  {
    id: '519151e2-893c-47d4-a482-c17b8df45f54',
    nome: 'O voo do pássaro ',
    categoria: 'Para a Mesa',
    lojaLabel: 'Utilitários',
  },
  {
    id: '7c44dfc9-b7e2-4dd4-8991-f6a17e5890e7',
    nome: 'Borboleta ',
    categoria: 'Para a Mesa',
    lojaLabel: 'Utilitários',
  },
  {
    id: '1647fcdc-673a-4a4a-b0af-d9f74a0f9c55',
    nome: 'teste',
    categoria: 'Para a Mesa',
    lojaLabel: 'Utilitários',
  },
] as const

export const PRODUTOS_TESTE_LEGADO_IDS = PRODUTOS_TESTE_LEGADO.map((p) => p.id)
