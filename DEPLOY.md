# VRG Cerâmicas — Publicar em Produção

Guia completo para colocar o site público e o painel administrativo no ar.

---

## Pré-requisitos

- Conta no [Supabase](https://supabase.com) (já configurado localmente)
- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com) (gratuita, ideal para Next.js)

O build de produção já foi validado localmente com `npm run build`.

---

## Passo 1 — Banco de dados (Supabase)

No painel do Supabase, vá em **SQL Editor → New query** e execute os scripts **nesta ordem** (cada um em uma query separada):

| # | Arquivo | O que faz |
|---|---------|-----------|
| 1 | `supabase-schema.sql` | Produtos, configurações, bucket de imagens |
| 2 | `supabase-pecas.sql` | Tabela `pecas_estoque` |
| 3 | `supabase-custos.sql` | Tabela `custos_config` |
| 4 | `supabase-conteudo.sql` | Conteúdo editável do site |
| 5 | `supabase-conjuntos-completo.sql` | Conjuntos, precificação, RLS |
| 6 | `supabase-vendas.sql` | Dados de venda (peças vendidas) |
| 7 | `supabase-setup-pecas-completo.sql` | Catálogo inicial de peças *(opcional se já cadastrou)* |

> Se o projeto Supabase **já foi usado em desenvolvimento**, pule os scripts que já foram executados. Os arquivos usam `IF NOT EXISTS` / `ON CONFLICT` sempre que possível.

### Usuário administrador

1. Supabase → **Authentication → Users → Add user**
2. Crie e-mail e senha da administradora
3. Esse login acessa `/admin/login` em produção

### Bucket de imagens

Confirme em **Storage** que existe o bucket `produtos` (público). O script `supabase-schema.sql` cria automaticamente; se der erro de duplicata, o bucket já existe.

---

## Passo 2 — Variáveis de ambiente

Na Vercel (e no `.env.local` local), configure:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

- **URL e anon key:** Supabase → Settings → API
- **WhatsApp:** número com DDI + DDD, só dígitos (ex: `5511987654321`)

---

## Passo 3 — Enviar código para o GitHub

Na pasta do projeto:

```bash
cd vrg-ceramicas
git init
git add .
git commit -m "VRG Cerâmicas — site e painel admin"
```

Crie um repositório vazio no GitHub e conecte:

```bash
git remote add origin https://github.com/SEU-USUARIO/vrg-ceramicas.git
git branch -M main
git push -u origin main
```

---

## Passo 4 — Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → selecione `vrg-ceramicas`
3. Framework: **Next.js** (detectado automaticamente)
4. Em **Environment Variables**, adicione as 3 variáveis do Passo 2
5. Clique em **Deploy**

Aguarde ~2 minutos. A Vercel gera uma URL como `https://vrg-ceramicas.vercel.app`.

### Deploy via terminal (alternativa)

```bash
npx vercel login
npx vercel --prod
```

Informe as variáveis de ambiente quando solicitado, ou configure depois em **Project Settings → Environment Variables**.

---

## Passo 5 — Verificar em produção

| URL | O que testar |
|-----|--------------|
| `/` | Home com produtos em destaque |
| `/loja` | Listagem da loja |
| `/produtos/[slug]` | Página de produto |
| `/admin/login` | Login da administradora |
| `/admin/pecas` | Gestão de peças e conjuntos |
| `/admin/custos` | Configuração de custos |
| `/admin/vendas` | Registro de vendas |
| `/admin/conteudo` | Edição de textos do site |

### Checklist rápido

- [ ] Site carrega sem erro 500
- [ ] Imagens dos produtos aparecem (Storage + `next.config.ts`)
- [ ] Login admin funciona
- [ ] Salvar peça/conjunto no admin funciona
- [ ] Link WhatsApp abre com mensagem correta

---

## Domínio personalizado (opcional)

Na Vercel: **Project → Settings → Domains**

Exemplo: `www.vrgceramicas.com.br` → aponte o DNS (CNAME) para `cname.vercel-dns.com`.

---

## Atualizações futuras

Cada `git push` na branch `main` dispara um novo deploy automaticamente na Vercel.

Para mudanças no banco, execute o SQL correspondente no Supabase e faça push do código se houver alterações no app.

---

## Resumo

| Etapa | Onde |
|-------|------|
| Banco + auth + storage | Supabase |
| Código | GitHub |
| Hospedagem do site | Vercel |
| Admin | `seusite.com/admin` |
| Site | `seusite.com` |
