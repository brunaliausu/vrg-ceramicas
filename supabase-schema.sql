-- ============================================================
-- VRG Cerâmicas Artesanais — Schema do Banco de Dados
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Tabela de produtos
create table public.produtos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  slug text not null unique,
  categoria text not null check (categoria in ('Utilitários', 'Decorativos', 'Conjuntos', 'Utilitário/Decorativo')),
  colecao text,
  descricao text,
  preco numeric(10, 2),
  status text not null default 'Rascunho'
    check (status in ('Rascunho', 'Disponível', 'Vendido', 'Sob Encomenda')),
  aceita_encomenda boolean default false not null,
  destaque_home boolean default false not null,
  destaque_loja boolean default false not null,
  ordem_exibicao integer,
  cor text,
  material text,
  acabamento text,
  medidas text,
  capacidade text,
  peso integer,
  cuidados text[] default '{}',
  imagens text[] default '{}',
  criado_em timestamp with time zone default now() not null,
  atualizado_em timestamp with time zone default now() not null
);

-- Tabela de configurações globais
create table public.configuracoes (
  id integer primary key default 1,
  mostrar_vendidos boolean default true not null,
  constraint single_row check (id = 1)
);

insert into public.configuracoes (id, mostrar_vendidos) values (1, true);

-- Função para atualizar atualizado_em automaticamente
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger update_produtos_updated_at
  before update on public.produtos
  for each row
  execute function public.update_updated_at_column();

-- ============================================================
-- Segurança por linha (RLS)
-- ============================================================

alter table public.produtos enable row level security;
alter table public.configuracoes enable row level security;

-- Produtos: público pode ler todos exceto Rascunho
create policy "Produtos visíveis ao público" on public.produtos
  for select
  using (status != 'Rascunho');

-- Produtos: admin tem acesso total
create policy "Admin acesso total" on public.produtos
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Configurações: público pode ler
create policy "Configurações públicas" on public.configuracoes
  for select using (true);

-- Configurações: admin pode editar
create policy "Admin edita configurações" on public.configuracoes
  for update
  using (auth.role() = 'authenticated');

-- ============================================================
-- Storage para imagens dos produtos
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'produtos',
  'produtos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "Imagens públicas" on storage.objects
  for select using (bucket_id = 'produtos');

create policy "Admin faz upload" on storage.objects
  for insert
  with check (auth.role() = 'authenticated' and bucket_id = 'produtos');

create policy "Admin atualiza imagens" on storage.objects
  for update
  using (auth.role() = 'authenticated' and bucket_id = 'produtos');

create policy "Admin deleta imagens" on storage.objects
  for delete
  using (auth.role() = 'authenticated' and bucket_id = 'produtos');
