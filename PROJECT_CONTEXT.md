# VRG Cerâmicas Artesanais — Contexto Completo do Projeto

> Este arquivo reúne todo o planejamento, decisões de negócio e arquitetura do projeto.
> Deve ser mantido atualizado a cada mudança relevante.

---

## 1. Visão Geral

**Nome:** VRG Cerâmicas Artesanais
**Tipo de produto:** Site portfólio + canal de vendas
**Modelo de venda:** Híbrido — peças prontas via WhatsApp + encomendas personalizadas
**Público-alvo:** Pessoas que valorizam produtos artesanais, decoração, design, exclusividade e peças autorais.

**Posicionamento:** Sofisticação, autenticidade, exclusividade, delicadeza e produção manual.

---

## 2. Benchmark e Referências

### Referências internacionais
| Marca | Referência |
|---|---|
| East Fork Pottery (EUA) | Ecommerce com storytelling e venda por coleções |
| Jono Pandolfi (EUA) | Tom editorial, fotografia impecável |
| Mud Australia | Grid minimalista, navegação por cor |
| 1882 Ltd (Reino Unido) | Direção de arte autoral |
| Gidon Bing (Nova Zelândia) | Tom arquitetônico, fotografia escultural |

### Padrões visuais comuns
- Muito espaço em branco (negativo) e composição arejada
- Fotografia como protagonista — luz natural, fundos neutros
- Paleta restrita (3 a 5 cores neutras)
- Tipografia serifada elegante + sans-serif limpa
- Storytelling de processo (barro, mãos, forno, ateliê)
- Sensação de escassez/exclusividade ("peça única", "edição limitada")

---

## 3. Branding

### Paleta de cores
| Token | Cor | Hex | Uso |
|---|---|---|---|
| `cru` | Off-white | `#F5F1EA` | Fundo principal |
| `areia` | Areia clara | `#EAE3D9` | Fundo secundário, cards |
| `carvao` | Carvão suave | `#2B2926` | Texto, botões primários |
| `terracota` | Terracota dessaturada | `#B08968` | Acento, destaques |
| `argila` | Argila / clay | `#C9A88B` | Detalhes quentes |
| `pedra` | Cinza pedra | `#D6CFC4` | Bordas, divisores |
| `muted` | Cinza médio | `#8A7E75` | Texto secundário |

**Regra:** Um único tom de acento (`terracota`) usado com parcimônia. Fundo nunca é branco puro nem preto puro.

### Tipografia
- **Títulos:** Cormorant Garamond (serif elegante, pesos 300–600)
- **Corpo/UI:** Inter (sans-serif neutra e legível)
- Classes Tailwind: `font-serif` e `font-sans`

### Direção de fotografia
- Luz natural lateral, sombras longas e suaves
- Fundos neutros (cru, linho, madeira clara, concreto)
- Mix: produto isolado + peça em uso + processo (mãos, ateliê)
- Padrão: proporção **4:5**, fundo alinhado à paleta do site

---

## 4. Estrutura do Site

### Mapa de páginas
```
/ (Home)
/loja (Catálogo)
/produtos/[slug] (Página de Produto — PDP)
/sobre
/processo
/contato
/admin/login
/admin (Lista de produtos)
/admin/produtos/novo
/admin/produtos/[id]
```

### Navegação pública
Header fixo: `VRG · Loja · Coleções · Sobre · Processo · Contato`
Footer: logo, navegação, Instagram, WhatsApp, links institucionais, "Feito à mão no Brasil"

---

## 5. Modelo de Negócio (Definido em Consultoria)

### Categorias de produtos (lista fechada)
- **Para a Mesa** — utilitários: canecas, jarras, tigelas, travessas
- **Para a Casa** — vasos, objetos de ambiente
- **Esculturais** — peças puramente decorativas e originais

### Coleções
- Campo **opcional**: a peça pode pertencer a uma coleção ou ser **avulsa**
- Coleção de lançamento: **Flor de Lis**
- Cada coleção pode ter tema, técnica, temporada ou edição (não há tipo fixo)

### Status dos produtos (lista fechada)
| Status | Visível no site? | Comportamento |
|---|---|---|
| **Rascunho** | ❌ Nunca | Visível apenas no admin |
| **Disponível** | ✅ Sim | Preço + "Comprar pelo WhatsApp" |
| **Vendido** | ⚙️ Configurável | Selo "Peça vendida" (sem botão de compra) |
| **Sob Encomenda** | ✅ Sim | "Solicitar Encomenda" + formulário |

**Fluxos de status:**
```
Rascunho → Disponível → Vendido
Rascunho → Sob Encomenda
```

### Modelo de venda — dois fluxos

**Fluxo A — Disponível**
- Exibe preço (formato: `R$ 280`, sem centavos)
- Botão "Comprar pelo WhatsApp" → link `wa.me` pré-preenchido
- Se `aceita_encomenda = true`: também exibe "Solicitar Encomenda"

**Fluxo B — Sob Encomenda**
- Exibe "Sob consulta" (sem preço)
- Formulário de encomenda diretamente na página
- Campos: Nome · WhatsApp · O que deseja · Quantidade
- Ao enviar → redireciona para WhatsApp com mensagem formatada

**Campo independente `aceita_encomenda` (Sim/Não)**
Peças com qualquer status (incluindo Vendido) podem aceitar encomendas de projetos novos. Toda encomenda é sempre um **projeto do zero** (não é cópia de peça existente).

**Aviso obrigatório em encomendas:**
> "Por ser uma peça artesanal, pode haver pequenas variações. Encomendas iniciam com sinal de 50%."

### Regras de precificação
- Preço exibido como valor redondo em R$ (`R$ 280`, sem centavos)
- Peças Sob Encomenda: exibem "Sob consulta"
- Sem desconto ou promoção no MVP
- Frete: combinado no WhatsApp (não calculado no site)

### Regras de exibição na loja
1. Rascunho nunca aparece
2. Peças Vendidas: controladas pelo toggle global "Mostrar peças vendidas" no admin
3. Ordenação: campo `ordem_exibicao` manual; sem ordem → mais recentes primeiro
4. Peças vendidas sempre empurradas para o **final** da listagem
5. Destaque Home e Destaque Loja são controles independentes
6. Grid da loja: **foto + nome** (minimalista). Preço e descrição só na página do produto.

---

## 6. Modelo de Dados (Supabase / PostgreSQL)

### Tabela `produtos`
| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | uuid | ✅ Auto | Identificador único |
| `nome` | text | ✅ | Nome da peça |
| `slug` | text | ✅ Auto | URL amigável (gerado do nome) |
| `categoria` | text | ✅ | Para a Mesa / Para a Casa / Esculturais |
| `colecao` | text | ❌ | Ex: "Flor de Lis" |
| `descricao` | text | ❌ | Texto descritivo da peça |
| `preco` | numeric(10,2) | ⚙️ | Obrigatório se Disponível |
| `status` | text | ✅ | Rascunho / Disponível / Vendido / Sob Encomenda |
| `aceita_encomenda` | boolean | ✅ | Padrão: false |
| `destaque_home` | boolean | ✅ | Padrão: false |
| `destaque_loja` | boolean | ✅ | Padrão: false |
| `ordem_exibicao` | integer | ❌ | Posição manual na loja |
| `cor` | text | ❌ | Lista fechada (ver abaixo) |
| `material` | text | ❌ | Lista fechada (ver abaixo) |
| `acabamento` | text | ❌ | Lista fechada (ver abaixo) |
| `medidas` | text | ❌ | Ex: "Alt. 15 × Diâm. 10 cm" |
| `capacidade` | text | ❌ | Ex: "300 ml" |
| `peso` | integer | ❌ | Em gramas |
| `cuidados` | text[] | ❌ | Array de opções (ver abaixo) |
| `imagens` | text[] | ⚙️ | URLs do Supabase Storage |
| `criado_em` | timestamptz | ✅ Auto | |
| `atualizado_em` | timestamptz | ✅ Auto | |

### Tabela `configuracoes`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | integer | Sempre 1 (linha única) |
| `mostrar_vendidos` | boolean | Controle global de peças vendidas na loja |

### Listas fechadas (evitam erro de digitação)

**Cor / tom:**
Neutro / Cru · Branco · Preto · Terracota · Bege / Areia · Verde · Azul · Outro

**Material:**
Grés · Faiança · Porcelana

**Acabamento:**
Esmaltada · Fosca · Brilhante · Crua

**Cuidados e uso:**
Indicada para alimentos · Pode ir ao microondas · Pode ir à lava-louças · Apenas decorativa · Impermeável

---

## 7. Painel Administrativo (`/admin`)

A administradora **nunca acessa o Supabase diretamente**. Todo o gerenciamento acontece no `/admin` com interface em português.

### Telas do admin
1. **Login** — E-mail + senha (via Supabase Auth)
2. **Lista de produtos** — Busca por nome, filtro por status, ações rápidas, toggle de peças vendidas
3. **Cadastrar / Editar produto** — Formulário completo com upload de fotos

### Ações disponíveis
- Salvar produto / Editar produto / Excluir produto (com confirmação)
- Marcar como vendido (ação rápida na lista)
- Marcar como destaque na Home (ação rápida na lista — ★)
- Controlar destaque Home e destaque Loja (no formulário)
- Upload, pré-visualização e remoção de fotos
- Toggle global "Mostrar peças vendidas na loja"

### Princípios de UX do admin
- 100% em português, zero termos técnicos
- Campos fixos como listas de seleção (nunca texto livre para status/categoria)
- Mensagens claras: "Produto salvo com sucesso!", "Rascunho — não aparece no site"
- Confirmação antes de excluir: "Esta ação não pode ser desfeita"

---

## 8. Integração WhatsApp

**Número configurado em:** `NEXT_PUBLIC_WHATSAPP_NUMBER` (`.env.local`)
Formato: somente números com DDI + DDD (ex: `5511999999999`)

**Mensagem — Compra direta:**
> "Olá! Tenho interesse na peça *[Nome]* (R$ [Preço]). Ela ainda está disponível?"

**Mensagem — Formulário de encomenda:**
> "Olá! Gostaria de solicitar uma encomenda.
> Nome: [nome] · Contato: [whatsapp] · Descrição: [texto] · Quantidade: [n]
> Encomendas iniciam com sinal de 50%. Pode haver pequenas variações."

---

## 9. SEO

### Estratégia inicial
- Long-tail com intenção de compra e decoração
- Schema.org: `Product`, `Organization`, `BreadcrumbList`
- Performance via Next.js (SSR/SSG, next/image)
- Sitemap e metatags por página

### Estrutura de URLs
```
/loja
/loja?categoria=Para+a+Mesa
/loja?colecao=flor-de-lis
/produtos/[slug]
/sobre
/processo
/contato
```

### Palavras-chave prioritárias
- cerâmica artesanal, louça artesanal, cerâmica feita à mão
- comprar caneca de cerâmica artesanal, vaso de cerâmica feito à mão
- peças de cerâmica autoral, presente artesanal exclusivo

---

## 10. Arquitetura Técnica

### Stack
| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Estilo | Tailwind CSS v4 (tokens via CSS `@theme`) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (e-mail + senha) |
| Storage de imagens | Supabase Storage (bucket `produtos`, público) |
| Formulários | React Hook Form + Zod v4 |
| Animações | Framer Motion |
| Estado | Zustand (reservado para carrinho — Fase 2) |

### Estrutura de pastas
```
vrg-ceramicas/
├── app/
│   ├── (site)/               # Site público (com Header/Footer)
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Home
│   │   ├── loja/page.tsx
│   │   ├── produtos/[slug]/page.tsx
│   │   ├── sobre/page.tsx
│   │   ├── processo/page.tsx
│   │   └── contato/page.tsx
│   ├── admin/                # Painel admin (protegido por auth)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── page.tsx          # Lista de produtos
│   │   ├── produtos/
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── LogoutButton.tsx
│   │   ├── AcoesRapidas.tsx
│   │   └── MostrarVendidosToggle.tsx
│   ├── globals.css           # Design tokens + Tailwind config
│   └── layout.tsx            # Root layout (fontes, metadata)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── WhatsAppButton.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── StatusBadge.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   └── ProductGallery.tsx
│   ├── sections/
│   │   └── EncomendaForm.tsx
│   └── admin/
│       ├── ProductForm.tsx
│       └── ImageUpload.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   ├── utils.ts              # formatPreco, generateSlug, cn
│   └── whatsapp.ts           # Builders de links wa.me
├── types/
│   └── index.ts              # Tipos TypeScript + constantes
├── middleware.ts             # Proteção das rotas /admin
├── supabase-schema.sql       # Schema completo do banco
├── .env.local.example        # Template de variáveis de ambiente
├── SETUP.md                  # Guia de configuração do Supabase
└── PROJECT_CONTEXT.md        # Este arquivo
```

### Variáveis de ambiente (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

---

## 11. Roadmap

### Fase 1 — MVP (atual)
✅ Design system completo (paleta, tipografia, tokens Tailwind)
✅ Site público: Home, Loja, Produto (dois fluxos), Sobre, Processo, Contato
✅ Painel `/admin`: login, lista, formulário com upload de fotos
✅ Integração WhatsApp (compra + encomenda)
✅ Schema SQL do Supabase
⬜ Configurar Supabase (credenciais + schema)
⬜ Cadastrar os 20+ produtos com placeholders
⬜ Fotos oficiais das peças

### Fase 2 — Ecommerce
⬜ Carrinho + checkout no site
⬜ Gateway de pagamento (Mercado Pago ou Stripe + Pix)
⬜ Cálculo de frete por CEP
⬜ E-mails transacionais

### Fase 3 — Crescimento
⬜ Newsletter
⬜ Blog / SEO de conteúdo
⬜ Coleções sazonais e lançamentos
⬜ Reviews e depoimentos

### Fase 4 — Escala
⬜ Multi-idioma / frete internacional
⬜ Linha B2B (restaurantes, hotéis)
⬜ Automação de marketing

---

## 12. Decisões Técnicas Registradas

| Decisão | Alternativas consideradas | Motivo da escolha |
|---|---|---|
| Supabase | Firebase, Sanity, Strapi | Banco relacional + Auth + Storage num único serviço, plano free generoso, fácil manutenção |
| Admin próprio em `/admin` | Supabase Studio, Sanity Studio | Interface 100% em português, UX para pessoa leiga, campos exatos do negócio |
| Venda via WhatsApp no MVP | Checkout + gateway | Sem complexidade de pagamento, validação de demanda antes do investimento |
| Categorias por uso/ambiente | Por tipo de objeto | Peças com dupla função não cabem em categoria de "vaso" ou "caneca" |
| `aceita_encomenda` separado de `status` | Tipo único (peça pronta / sob encomenda) | Peça pode estar Disponível E aceitar encomenda; Vendida E aceitar encomenda |
| Encomenda = projeto do zero | Reprodução de peça existente | Protege a marca, alinha com a realidade artesanal |
| Preço em R$ inteiro | Centavos | Peças artesanais têm valores redondos; mais elegante visualmente |

---

## 13. Contatos e Contas

> Preencher conforme as contas forem criadas

| Serviço | Conta / URL | Observação |
|---|---|---|
| Supabase | — | Criar em supabase.com |
| Vercel | — | Deploy do site |
| Instagram | @vrgceramicas | Vincular ao footer |
| WhatsApp Business | — | Preencher em `.env.local` |
