-- Schema do backend self-hosted (Postgres puro, sem Supabase/RLS).
-- A autorização é feita na API (filtra por user_id do JWT). Banco começa limpo.
-- gen_random_uuid() é nativo do Postgres 13+ (sem extensões).

-- ───────────────────────── Auth (substitui GoTrue) ─────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
-- E-mail único case-insensitive (a API normaliza para minúsculas).
create unique index if not exists users_email_lower_key on users (lower(email));

-- Refresh tokens (guardamos só o hash). Access tokens são JWT stateless.
create table if not exists auth_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null unique,
  expires_at         timestamptz not null,
  revoked_at         timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists auth_sessions_user_idx on auth_sessions (user_id);

-- ───────────────────────── Conexão GitHub (OAuth por usuário) ─────────────────────────
-- Guarda o token OAuth do GitHub de cada usuário (1:1) para listar repositórios
-- e navegar arquivos no gerador. O token é cifrado em repouso (AES-256-GCM) pela
-- API antes de gravar — nunca em texto puro. A coluna guarda o blob cifrado.
create table if not exists github_accounts (
  user_id       uuid primary key references users(id) on delete cascade,
  github_login  text not null,
  github_id     bigint,
  access_token  text not null,            -- cifrado (iv:tag:ciphertext em base64)
  scope         text,
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ───────────────────────── Telemetria (Fase A) ─────────────────────────
create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  session_id text not null,
  user_id    uuid references users(id) on delete set null,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  constraint events_type_len        check (char_length(type) <= 64),
  constraint events_session_len     check (char_length(session_id) <= 64),
  constraint events_payload_object  check (jsonb_typeof(payload) = 'object'),
  constraint events_payload_size    check (octet_length(payload::text) <= 10240)
);
create index if not exists events_created_idx on events (created_at);
create index if not exists events_type_idx    on events (type);

-- ───────────────────────── Cache de prompts (Fase B) ─────────────────────────
create table if not exists prompt_cache (
  hash       text primary key,            -- sha256 hex de stableStringify({messages,temperature})
  response   jsonb not null,              -- { content, model, provider }
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists prompt_cache_expires_idx on prompt_cache (expires_at);

-- ───────────────────────── Rate limiting (janela deslizante, #6) ─────────────────────────
create table if not exists rate_limit_hits (
  id     text not null,                   -- ex.: 'llm:user:<uuid>' ou 'llm:ip:<ip>'
  hit_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_idx on rate_limit_hits (id, hit_at);

-- ───────────────────────── Biblioteca (coleções + prompts salvos) ─────────────────────────
create table if not exists collections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index if not exists collections_user_idx on collections (user_id);

create table if not exists saved_prompts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  template   text,
  title      text,
  content    text not null,
  collection uuid references collections(id) on delete set null,
  tags       text[] not null default '{}',
  favorite   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists saved_prompts_user_idx on saved_prompts (user_id, created_at desc);
