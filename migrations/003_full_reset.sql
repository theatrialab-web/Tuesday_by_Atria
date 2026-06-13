-- ============================================================
-- 003_full_reset.sql — Esquema completo (reset)
-- ADVERTENCIA: elimina todas las tablas de la app y sus datos
-- (workspaces, boards, tareas, etc). Conserva auth.users y profiles.
-- Ejecutar completo en Supabase → SQL Editor → Run.
-- ============================================================

-- ---------- 0. Limpieza (incluye residuos del debugging) ----------
drop table if exists public.notifications cascade;
drop table if exists public.task_files cascade;
drop table if exists public.comments cascade;
drop table if exists public.task_values cascade;
drop table if exists public.tasks cascade;
drop table if exists public.board_columns cascade;
drop table if exists public.boards cascade;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.debug_log cascade;
drop table if exists public.debug_log2 cascade;
drop function if exists public.debug_check() cascade;
drop function if exists public.debug_auth_uid() cascade;
drop function if exists public.handle_new_workspace() cascade;
drop function if exists public.is_workspace_member(uuid) cascade;
drop function if exists public.is_board_member(uuid) cascade;
drop function if exists public.notify_on_task_value() cascade;
drop function if exists public.notify_on_comment() cascade;

-- ---------- 1. Profiles (idempotente, se conserva si existe) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Perfiles visibles para autenticados" on public.profiles;
create policy "Perfiles visibles para autenticados"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Editar mi perfil" on public.profiles;
create policy "Editar mi perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: perfiles para usuarios que ya existen
insert into public.profiles (id, email, full_name, avatar_url)
select u.id, u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email,'@',1)),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
on conflict (id) do nothing;

-- ---------- 2. Workspaces ----------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  icon text default 'briefcase',
  color text default '#290880',
  created_at timestamptz default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- Helper SECURITY DEFINER: evita recursión RLS workspaces<->members
create or replace function public.is_workspace_member(ws uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;

-- CLAVE: el owner ve su workspace directamente (sin depender de la
-- membresía), así el RETURNING del insert no falla. Este fue el bug
-- original del 42501.
create policy "Ver workspaces"
  on public.workspaces for select to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(id));

create policy "Crear workspaces"
  on public.workspaces for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Editar workspaces"
  on public.workspaces for update to authenticated
  using (public.is_workspace_member(id));

create policy "Eliminar workspaces"
  on public.workspaces for delete to authenticated
  using (owner_id = auth.uid());

alter table public.workspace_members enable row level security;

create policy "Ver miembros"
  on public.workspace_members for select to authenticated
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));

create policy "Agregar miembros"
  on public.workspace_members for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "Quitar miembros"
  on public.workspace_members for delete to authenticated
  using (user_id = auth.uid() or public.is_workspace_member(workspace_id));

-- Trigger: el creador queda como miembro automáticamente.
-- SECURITY DEFINER para que no choque con la policy de insert de members.
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id)
  values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end; $$;

create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- ---------- 3. Boards y columnas ----------
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  position double precision default 0,
  created_at timestamptz default now()
);

create table public.board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  type text not null check (type in ('status','person','date','tag','priority','number','text')),
  options jsonb default '[]'::jsonb,
  position double precision default 0
);

create or replace function public.is_board_member(b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from public.boards bo
    join public.workspace_members m on m.workspace_id = bo.workspace_id
    where bo.id = b and m.user_id = auth.uid()
  );
$$;

alter table public.boards enable row level security;
create policy "Boards: todo para miembros" on public.boards
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

alter table public.board_columns enable row level security;
create policy "Columnas: todo para miembros" on public.board_columns
  for all to authenticated
  using (public.is_board_member(board_id))
  with check (public.is_board_member(board_id));

-- ---------- 4. Tareas y valores ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  completed boolean default false,
  position double precision default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
create index tasks_board_idx on public.tasks(board_id);
create index tasks_parent_idx on public.tasks(parent_task_id);

create table public.task_values (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  column_id uuid not null references public.board_columns(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  value jsonb,
  updated_at timestamptz default now(),
  unique (task_id, column_id)
);
create index task_values_board_idx on public.task_values(board_id);
create index task_values_task_idx on public.task_values(task_id);

alter table public.tasks enable row level security;
create policy "Tareas: todo para miembros" on public.tasks
  for all to authenticated
  using (public.is_board_member(board_id))
  with check (public.is_board_member(board_id));

alter table public.task_values enable row level security;
create policy "Valores: todo para miembros" on public.task_values
  for all to authenticated
  using (public.is_board_member(board_id))
  with check (public.is_board_member(board_id));

-- ---------- 5. Comentarios y archivos ----------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  mentioned_user_ids uuid[] default '{}',
  created_at timestamptz default now()
);
create index comments_task_idx on public.comments(task_id);

alter table public.comments enable row level security;
create policy "Comentarios: leer para miembros" on public.comments
  for select to authenticated using (public.is_board_member(board_id));
create policy "Comentarios: crear propios" on public.comments
  for insert to authenticated
  with check (user_id = auth.uid() and public.is_board_member(board_id));
create policy "Comentarios: borrar propios" on public.comments
  for delete to authenticated using (user_id = auth.uid());

create table public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  file_name text not null,
  file_path text not null,
  mime_type text,
  size bigint,
  created_at timestamptz default now()
);
create index task_files_task_idx on public.task_files(task_id);

alter table public.task_files enable row level security;
create policy "Archivos: todo para miembros" on public.task_files
  for all to authenticated
  using (public.is_board_member(board_id))
  with check (public.is_board_member(board_id));

-- ---------- 6. Notificaciones ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('assigned','mentioned','status_changed')),
  task_id uuid references public.tasks(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  content text,
  read boolean default false,
  created_at timestamptz default now()
);
create index notifications_user_idx on public.notifications(user_id, read);

alter table public.notifications enable row level security;
create policy "Mis notificaciones: leer" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "Mis notificaciones: marcar" on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Los INSERT los hacen solo los triggers (security definer), no el cliente.

-- Trigger: asignaciones y cambios de estado (sobre task_values)
create or replace function public.notify_on_task_value()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  col record;
  t record;
  ws uuid;
  uid uuid := auth.uid();
  new_ids uuid[];
  old_ids uuid[];
  added uuid;
  assignee uuid;
begin
  select * into col from public.board_columns where id = new.column_id;
  if col is null then return new; end if;

  select ta.title, ta.id into t from public.tasks ta where ta.id = new.task_id;
  select b.workspace_id into ws from public.boards b where b.id = new.board_id;

  if col.type = 'person' then
    new_ids := coalesce(
      (select array_agg((e.v)::uuid) from jsonb_array_elements_text(coalesce(new.value,'[]'::jsonb)) e(v)),
      '{}'::uuid[]
    );
    if tg_op = 'UPDATE' then
      old_ids := coalesce(
        (select array_agg((e.v)::uuid) from jsonb_array_elements_text(coalesce(old.value,'[]'::jsonb)) e(v)),
        '{}'::uuid[]
      );
    else
      old_ids := '{}'::uuid[];
    end if;
    foreach added in array new_ids loop
      if not (added = any(old_ids)) and added is distinct from uid then
        insert into public.notifications (user_id, actor_id, type, task_id, board_id, workspace_id, content)
        values (added, uid, 'assigned', new.task_id, new.board_id, ws, t.title);
      end if;
    end loop;

  elsif col.type = 'status' and tg_op = 'UPDATE'
        and new.value is distinct from old.value then
    -- Notificar a las personas asignadas a la tarea (excepto el actor)
    for assignee in
      select distinct (e.v)::uuid
      from public.task_values tv
      join public.board_columns c on c.id = tv.column_id and c.type = 'person'
      cross join jsonb_array_elements_text(coalesce(tv.value,'[]'::jsonb)) e(v)
      where tv.task_id = new.task_id
    loop
      if assignee is distinct from uid then
        insert into public.notifications (user_id, actor_id, type, task_id, board_id, workspace_id, content)
        values (assignee, uid, 'status_changed', new.task_id, new.board_id, ws, t.title);
      end if;
    end loop;
  end if;

  return new;
end; $$;

create trigger on_task_value_notify
  after insert or update on public.task_values
  for each row execute function public.notify_on_task_value();

-- Trigger: menciones en comentarios
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ws uuid;
  t_title text;
  m uuid;
begin
  select b.workspace_id into ws from public.boards b where b.id = new.board_id;
  select title into t_title from public.tasks where id = new.task_id;
  foreach m in array coalesce(new.mentioned_user_ids, '{}'::uuid[]) loop
    if m is distinct from new.user_id then
      insert into public.notifications (user_id, actor_id, type, task_id, board_id, workspace_id, content)
      values (m, new.user_id, 'mentioned', new.task_id, new.board_id, ws, t_title);
    end if;
  end loop;
  return new;
end; $$;

create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ---------- 7. Realtime ----------
do $$
begin
  begin alter publication supabase_realtime add table public.tasks; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.task_values; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- ---------- 8. Storage (bucket de archivos) ----------
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do nothing;

drop policy if exists "task-files insert" on storage.objects;
create policy "task-files insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'task-files');

drop policy if exists "task-files select" on storage.objects;
create policy "task-files select" on storage.objects
  for select to authenticated using (bucket_id = 'task-files');

drop policy if exists "task-files delete" on storage.objects;
create policy "task-files delete" on storage.objects
  for delete to authenticated using (bucket_id = 'task-files' and owner = auth.uid());
