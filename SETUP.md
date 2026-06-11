# VRG Cerâmicas — Guia de Configuração

## 1. Configurar o Supabase

### 1.1 Criar conta e projeto
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New Project**, dê um nome (ex: `vrg-ceramicas`) e escolha uma senha forte.
3. Aguarde o projeto iniciar (~1 minuto).

### 1.2 Criar o banco de dados
1. No painel do Supabase, vá em **SQL Editor** (menu lateral).
2. Clique em **+ New query**.
3. Copie todo o conteúdo do arquivo `supabase-schema.sql` e cole no editor.
4. Clique em **Run** (ou `Ctrl+Enter`).
5. Deve aparecer "Success" para cada comando.

### 1.3 Criar o usuário administrador
1. No Supabase, vá em **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Informe o e-mail e senha da administradora.
4. Clique em **Create User**.

> Este é o login que a administradora vai usar em `/admin/login`.

### 1.4 Obter as credenciais
1. No Supabase, vá em **Settings → API**.
2. Copie:
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (começa com `eyJ...`)

## 2. Configurar o projeto local

### 2.1 Criar o arquivo de variáveis
1. Na pasta do projeto, copie o arquivo `.env.local.example` e renomeie para `.env.local`.
2. Abra `.env.local` e preencha:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_WHATSAPP_NUMBER=5511999999999
```

> Substitua o número pelo WhatsApp real da VRG (somente números, com DDD e DDI: 55 + 11 + número).

## 3. Rodar o projeto

Abra o terminal na pasta do projeto e execute:

```bash
npm run dev
```

O site abre em: **http://localhost:3000**
O admin abre em: **http://localhost:3000/admin**

## 4. Publicar o site (deploy)

Recomendamos a **Vercel** — é gratuita e feita para Next.js.

1. Acesse [vercel.com](https://vercel.com) e crie uma conta.
2. Conecte com o GitHub e importe o repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do `.env.local`.
4. Clique em **Deploy**.

---

## Resumo rápido

| O que fazer | Onde |
|---|---|
| Criar banco de dados | Supabase → SQL Editor |
| Criar login da admin | Supabase → Authentication → Users |
| Pegar URL e chave | Supabase → Settings → API |
| Configurar variáveis | Arquivo `.env.local` |
| Rodar local | Terminal: `npm run dev` |
| Publicar | Vercel |
