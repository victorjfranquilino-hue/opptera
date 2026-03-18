-- ═══════════════════════════════════════════════════
-- OPPTERA – Schema completo do banco de dados
-- Cole este SQL no SQL Editor do Supabase e execute
-- ═══════════════════════════════════════════════════

-- Extensão para UUID
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────
-- TABELA: parceiros (empresas de consultoria)
-- ─────────────────────────────────────────────────────
create table if not exists parceiros (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  nome_fantasia text not null,
  razao_social text not null,
  cnpj text not null,
  email text not null,
  telefone text,
  cidade text,
  estado text,
  cor_primaria text default '#6B46C1',
  logo_url text,
  created_at timestamptz default now()
);

alter table parceiros enable row level security;
create policy "parceiro_own" on parceiros
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────
-- TABELA: usuarios (usuários do parceiro)
-- ─────────────────────────────────────────────────────
create table if not exists usuarios (
  id uuid primary key default uuid_generate_v4(),
  parceiro_id uuid references parceiros(id) on delete cascade,
  user_id uuid references auth.users(id),
  nome text not null,
  email text not null,
  perfil text not null default 'analista',
  ativo boolean default true,
  created_at timestamptz default now()
);

alter table usuarios enable row level security;
create policy "usuarios_parceiro" on usuarios
  for all using (
    parceiro_id in (select id from parceiros where user_id = auth.uid())
  );

-- ─────────────────────────────────────────────────────
-- TABELA: clientes
-- ─────────────────────────────────────────────────────
create table if not exists clientes (
  id uuid primary key default uuid_generate_v4(),
  parceiro_id uuid references parceiros(id) on delete cascade,
  razao_social text not null,
  cnpj text not null,
  email_responsavel text not null,
  emails_profissionais text[],
  telefone text,
  etapa text default 'upload',
  status text default 'ativo',
  oportunidade_valor numeric default 0,
  upload_token uuid default uuid_generate_v4() unique,
  created_at timestamptz default now()
);

alter table clientes enable row level security;
create policy "clientes_parceiro" on clientes
  for all using (
    parceiro_id in (select id from parceiros where user_id = auth.uid())
  );

-- leitura pública pelo token (para página de upload white label)
create policy "clientes_token_public" on clientes
  for select using (true);

-- ─────────────────────────────────────────────────────
-- TABELA: documentos
-- ─────────────────────────────────────────────────────
create table if not exists documentos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid references clientes(id) on delete cascade,
  parceiro_id uuid references parceiros(id) on delete cascade,
  nome_arquivo text not null,
  tipo_documento text not null,
  storage_path text not null,
  tamanho_bytes bigint,
  enviado_por text,
  created_at timestamptz default now()
);

alter table documentos enable row level security;
create policy "docs_parceiro" on documentos
  for all using (
    parceiro_id in (select id from parceiros where user_id = auth.uid())
  );

-- insert público (para uploads via token)
create policy "docs_insert_public" on documentos
  for insert with check (true);

-- ─────────────────────────────────────────────────────
-- STORAGE BUCKET: documentos-fiscais
-- ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('documentos-fiscais', 'documentos-fiscais', false)
on conflict do nothing;

-- Política de upload público (via token)
create policy "upload_publico" on storage.objects
  for insert with check (bucket_id = 'documentos-fiscais');

-- Política de leitura apenas para autenticados
create policy "leitura_autenticados" on storage.objects
  for select using (
    bucket_id = 'documentos-fiscais' and auth.role() = 'authenticated'
  );

-- ─────────────────────────────────────────────────────
-- FUNÇÃO: atualizar etapa do cliente ao receber docs
-- ─────────────────────────────────────────────────────
create or replace function atualizar_contagem_docs()
returns trigger as $$
begin
  -- quando chega o primeiro doc, avança para processamento se ainda em upload
  update clientes
  set etapa = case when etapa = 'upload' then 'processamento' else etapa end
  where id = NEW.cliente_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_doc_insert
  after insert on documentos
  for each row execute function atualizar_contagem_docs();
