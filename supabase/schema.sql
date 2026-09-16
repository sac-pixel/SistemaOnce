-- Casos ORNE — schema do banco de dados
-- Execute este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query)

-- ==========================================================================
-- Tipos enumerados
-- ==========================================================================

create type caso_status as enum (
  'novo',
  'em_analise',
  'aguardando_cliente',
  'resolvido'
);

create type caso_categoria as enum (
  'defeito',
  'cor_modelo_errado',
  'incompleto',
  'atraso_entrega',
  'outro'
);

create type responsavel as enum (
  'paula',
  'marilia',
  'olivia',
  'erick'
);

-- ==========================================================================
-- Tabela: casos
-- ==========================================================================

create table casos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text not null,
  cliente text,
  canal_origem text,
  categoria caso_categoria not null default 'outro',
  descricao text,
  status caso_status not null default 'novo',
  responsavel responsavel,
  registrado_por uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index casos_status_idx on casos (status);
create index casos_categoria_idx on casos (categoria);
create index casos_numero_pedido_idx on casos (numero_pedido);

-- Mantém updated_at sempre em dia
create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger casos_set_updated_at
  before update on casos
  for each row
  execute function set_updated_at();

-- ==========================================================================
-- Tabela: anotacoes (histórico do caso, sem edição/exclusão)
-- ==========================================================================

create table anotacoes (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos (id) on delete cascade,
  autor_id uuid references auth.users (id),
  autor_nome text not null,
  conteudo text not null,
  created_at timestamptz not null default now()
);

create index anotacoes_caso_id_idx on anotacoes (caso_id);

-- ==========================================================================
-- Tabela: fotos (metadados; arquivos ficam no Storage)
-- ==========================================================================

create table fotos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos (id) on delete cascade,
  storage_path text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index fotos_caso_id_idx on fotos (caso_id);

-- ==========================================================================
-- Row Level Security
-- Qualquer usuário autenticado (equipe SAC logada) pode ler e escrever.
-- ==========================================================================

alter table casos enable row level security;
alter table anotacoes enable row level security;
alter table fotos enable row level security;

create policy "usuarios autenticados podem tudo em casos"
  on casos for all
  to authenticated
  using (true)
  with check (true);

create policy "usuarios autenticados podem ler anotacoes"
  on anotacoes for select
  to authenticated
  using (true);

create policy "usuarios autenticados podem criar anotacoes"
  on anotacoes for insert
  to authenticated
  with check (true);

-- Anotações não podem ser editadas nem excluídas (preserva histórico).
-- Nenhuma policy de update/delete é criada de propósito.

create policy "usuarios autenticados podem tudo em fotos"
  on fotos for all
  to authenticated
  using (true)
  with check (true);

-- ==========================================================================
-- Realtime: habilita broadcast de mudanças para as 3 tabelas
-- ==========================================================================

alter publication supabase_realtime add table casos;
alter publication supabase_realtime add table anotacoes;
alter publication supabase_realtime add table fotos;

-- ==========================================================================
-- Storage: bucket para fotos/vídeos de evidência
-- ==========================================================================

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;

create policy "usuarios autenticados podem enviar evidencias"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'evidencias');

create policy "usuarios autenticados podem ler evidencias"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'evidencias');

create policy "usuarios autenticados podem remover evidencias"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'evidencias');
