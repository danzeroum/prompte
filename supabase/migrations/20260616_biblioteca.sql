-- Migração: Biblioteca de Prompts
-- Adiciona tabela de coleções e campos opcionais em saved_prompts.
-- Segura para reaplicar (IF NOT EXISTS / IF NOT EXISTS em colunas).

-- 1. Tabela de coleções (dona: usuário autenticado)
create table if not exists public.collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

alter table public.collections enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'collections'
      and policyname = 'collections_owner'
  ) then
    create policy "collections_owner" on public.collections
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- 2. Novas colunas em saved_prompts (defaultam para compatibilidade com linhas antigas)
alter table public.saved_prompts
  add column if not exists collection uuid references public.collections(id) on delete set null,
  add column if not exists tags       text[] default '{}',
  add column if not exists favorite   boolean default false;
