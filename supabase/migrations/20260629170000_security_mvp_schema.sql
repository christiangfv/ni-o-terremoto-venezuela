-- Niño Terremoto Venezuela — MVP security-first schema
-- Phase 2: database, RLS, triggers, storage buckets, public RPC
-- Idempotent migration for Supabase Postgres.

begin;

create extension if not exists pgcrypto;

-- ---------- Types ----------
do $$ begin
  create type public.user_role as enum ('admin', 'organizacion', 'voluntario', 'salud_albergue', 'publico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.case_status as enum ('registrado', 'en_resguardo', 'requiere_atencion', 'en_traslado', 'reunificacion_pendiente', 'entregado', 'cerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.risk_level as enum ('bajo', 'medio', 'alto', 'critico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.sex_type as enum ('femenino', 'masculino', 'otro', 'desconocido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('pendiente', 'en_revision', 'aprobado', 'rechazado', 'duplicado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_type as enum ('case_created', 'case_updated', 'status_changed', 'photo_added', 'handover_created', 'transfer_created', 'public_report_created', 'public_report_reviewed', 'user_approved', 'role_changed', 'note_added');
exception when duplicate_object then null; end $$;

-- ---------- Helpers ----------
create or replace function public.try_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.generate_public_case_code()
returns text
language plpgsql
volatile
as $$
declare
  code text;
begin
  loop
    code := 'NTV' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 7));
    exit when not exists (select 1 from public.cases c where c.public_code = code);
  end loop;
  return code;
end;
$$;

-- ---------- Tables ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  contact_email text,
  contact_phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  full_name text,
  role public.user_role not null default 'publico',
  approved boolean not null default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_approved_requires_non_public_role check (approved = false or role <> 'publico')
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  public_code text not null unique,
  first_name text not null,
  last_name text,
  approximate_age int check (approximate_age is null or approximate_age between 0 and 17),
  sex public.sex_type not null default 'desconocido',
  status public.case_status not null default 'registrado',
  risk public.risk_level not null default 'medio',
  zone_general text,
  location_exact text,
  health_notes text,
  family_contact_notes text,
  internal_notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_photos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  bucket_id text not null default 'case-photos-private',
  storage_path text not null,
  is_public_preview boolean not null default false,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(bucket_id, storage_path)
);

create table if not exists public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  organization_id uuid not null references public.organizations(id),
  type public.event_type not null,
  title text not null,
  details jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.handovers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  organization_id uuid not null references public.organizations(id),
  recipient_name text not null,
  recipient_relationship text,
  recipient_document_ref text,
  verified_by uuid references auth.users(id),
  evidence_bucket_id text default 'handover-evidence-private',
  evidence_storage_path text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete restrict,
  organization_id uuid not null references public.organizations(id),
  from_zone text not null,
  to_zone text not null,
  from_location_exact text,
  to_location_exact text,
  reason text,
  responsible_person text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.public_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  public_code text,
  reporter_name text,
  reporter_contact text,
  message text not null,
  zone_general text,
  attachment_bucket_id text default 'public-report-uploads',
  attachment_storage_path text,
  status public.report_status not null default 'pendiente',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  moderation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_org_role on public.profiles(organization_id, role, approved);
create index if not exists idx_cases_org_status on public.cases(organization_id, status);
create index if not exists idx_cases_public_code on public.cases(public_code);
create index if not exists idx_case_events_case_created on public.case_events(case_id, created_at desc);
create index if not exists idx_public_reports_status on public.public_reports(status, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_table, entity_id, created_at desc);

-- ---------- Current-user authorization helpers ----------
create or replace function public.get_current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.* from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.approved = true
  );
$$;

create or replace function public.is_approved_role(roles public.user_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.approved = true
      and (roles is null or p.role = any(roles))
  );
$$;

create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select p.organization_id from public.profiles p where p.id = auth.uid() and p.approved = true;
$$;

create or replace function public.can_access_case(case_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin() or exists (
    select 1
    from public.cases c
    join public.profiles p on p.id = auth.uid()
    where c.id = case_uuid
      and p.approved = true
      and p.organization_id = c.organization_id
      and p.role in ('organizacion','voluntario','salud_albergue')
  );
$$;

-- ---------- Common triggers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_case_defaults()
returns trigger
language plpgsql
as $$
begin
  if new.public_code is null or length(trim(new.public_code)) = 0 then
    new.public_code := public.generate_public_case_code();
  end if;
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, role, approved)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'publico', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create or replace function public.insert_case_event(
  p_case_id uuid,
  p_org_id uuid,
  p_type public.event_type,
  p_title text,
  p_details jsonb default '{}'::jsonb,
  p_actor_id uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  event_id uuid;
begin
  insert into public.case_events(case_id, organization_id, type, title, details, actor_id)
  values (p_case_id, p_org_id, p_type, p_title, coalesce(p_details, '{}'::jsonb), p_actor_id)
  returning id into event_id;
  return event_id;
end;
$$;

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  org_id uuid;
  row_id uuid;
begin
  org_id := coalesce((to_jsonb(new)->>'organization_id')::uuid, (to_jsonb(old)->>'organization_id')::uuid);
  row_id := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);

  insert into public.audit_logs(organization_id, actor_id, action, entity_table, entity_id, old_data, new_data)
  values (org_id, auth.uid(), lower(tg_op), tg_table_name, row_id,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end);

  return coalesce(new, old);
end;
$$;

create or replace function public.case_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_case_event(new.id, new.organization_id, 'case_created', 'Caso creado', jsonb_build_object('status', new.status, 'risk', new.risk), new.created_by);
  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      perform public.insert_case_event(new.id, new.organization_id, 'status_changed', 'Estado actualizado', jsonb_build_object('from', old.status, 'to', new.status), auth.uid());
    else
      perform public.insert_case_event(new.id, new.organization_id, 'case_updated', 'Caso actualizado', '{}'::jsonb, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.handover_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.insert_case_event(new.case_id, new.organization_id, 'handover_created', 'Entrega registrada', jsonb_build_object('handover_id', new.id), auth.uid());
  update public.cases set status = 'entregado', updated_by = auth.uid(), updated_at = now() where id = new.case_id;
  return new;
end;
$$;

create or replace function public.transfer_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.insert_case_event(new.case_id, new.organization_id, 'transfer_created', 'Traslado registrado', jsonb_build_object('transfer_id', new.id, 'from_zone', new.from_zone, 'to_zone', new.to_zone), auth.uid());
  update public.cases set status = 'en_traslado', updated_by = auth.uid(), updated_at = now() where id = new.case_id;
  return new;
end;
$$;

create or replace function public.public_report_event_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  c public.cases;
begin
  if tg_op = 'INSERT' and new.case_id is not null then
    select * into c from public.cases where id = new.case_id;
    if c.id is not null then
      perform public.insert_case_event(c.id, c.organization_id, 'public_report_created', 'Reporte ciudadano recibido', jsonb_build_object('report_id', new.id), null);
    end if;
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.case_id is not null then
    select * into c from public.cases where id = new.case_id;
    if c.id is not null then
      perform public.insert_case_event(c.id, c.organization_id, 'public_report_reviewed', 'Reporte ciudadano revisado', jsonb_build_object('report_id', new.id, 'from', old.status, 'to', new.status), auth.uid());
    end if;
  end if;
  return new;
end;
$$;

-- attach triggers idempotently
drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists set_cases_defaults on public.cases;
create trigger set_cases_defaults before insert or update on public.cases for each row execute function public.set_case_defaults();

drop trigger if exists set_cases_updated_at on public.cases;
create trigger set_cases_updated_at before update on public.cases for each row execute function public.set_updated_at();

drop trigger if exists cases_event_trigger on public.cases;
create trigger cases_event_trigger after insert or update on public.cases for each row execute function public.case_event_trigger();

drop trigger if exists handover_event_trigger on public.handovers;
create trigger handover_event_trigger after insert on public.handovers for each row execute function public.handover_event_trigger();

drop trigger if exists transfer_event_trigger on public.transfers;
create trigger transfer_event_trigger after insert on public.transfers for each row execute function public.transfer_event_trigger();

drop trigger if exists public_report_event_trigger on public.public_reports;
create trigger public_report_event_trigger after insert or update on public.public_reports for each row execute function public.public_report_event_trigger();

-- audit selected sensitive tables
do $$
declare
  t text;
begin
  foreach t in array array['organizations','profiles','cases','case_photos','handovers','transfers','public_reports'] loop
    execute format('drop trigger if exists audit_%I on public.%I', t, t);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t, t);
  end loop;
end $$;

-- ---------- Public limited RPC ----------
create or replace function public.get_public_case_by_code(p_public_code text)
returns table (
  public_code text,
  display_name text,
  approximate_age int,
  sex public.sex_type,
  status public.case_status,
  zone_general text,
  public_photo_path text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    c.public_code,
    concat(left(c.first_name, 1), repeat('*', greatest(length(c.first_name)-1, 0)), case when c.last_name is not null and length(c.last_name) > 0 then ' ' || left(c.last_name, 1) || '.' else '' end) as display_name,
    c.approximate_age,
    c.sex,
    c.status,
    c.zone_general,
    (select cp.storage_path from public.case_photos cp where cp.case_id = c.id and cp.is_public_preview = true order by cp.created_at desc limit 1) as public_photo_path
  from public.cases c
  where c.public_code = upper(trim(p_public_code))
  limit 1;
$$;

-- ---------- RLS ----------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_photos enable row level security;
alter table public.case_events enable row level security;
alter table public.handovers enable row level security;
alter table public.transfers enable row level security;
alter table public.public_reports enable row level security;
alter table public.audit_logs enable row level security;

-- Force RLS for app-owned tables to avoid owner bypass via API roles.
alter table public.organizations force row level security;
alter table public.profiles force row level security;
alter table public.cases force row level security;
alter table public.case_photos force row level security;
alter table public.case_events force row level security;
alter table public.handovers force row level security;
alter table public.transfers force row level security;
alter table public.public_reports force row level security;
alter table public.audit_logs force row level security;

-- Drop old policies if re-running.
do $$
declare
  r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname='public' and tablename in ('organizations','profiles','cases','case_photos','case_events','handovers','transfers','public_reports','audit_logs') loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Organizations
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_admin() or (active = true and id = public.current_user_org_id()));
create policy organizations_insert_admin on public.organizations
  for insert to authenticated
  with check (public.is_admin());
create policy organizations_update_admin on public.organizations
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Profiles
create policy profiles_select_self_or_admin_or_org_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin() or (public.is_approved_role(array['organizacion']::public.user_role[]) and organization_id = public.current_user_org_id()));
create policy profiles_insert_self_pending on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and approved = false and role = 'publico');
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Cases
create policy cases_select_org_roles on public.cases
  for select to authenticated
  using (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','voluntario','salud_albergue']::public.user_role[])));
create policy cases_insert_org_roles on public.cases
  for insert to authenticated
  with check (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','voluntario','salud_albergue']::public.user_role[])));
create policy cases_update_org_or_health on public.cases
  for update to authenticated
  using (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])))
  with check (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])));

-- Photos
create policy case_photos_select_case_access on public.case_photos
  for select to authenticated
  using (public.can_access_case(case_id));
create policy case_photos_insert_case_access on public.case_photos
  for insert to authenticated
  with check (bucket_id = 'case-photos-private' and public.can_access_case(case_id));
create policy case_photos_update_org_or_admin on public.case_photos
  for update to authenticated
  using (public.can_access_case(case_id) and public.is_approved_role(array['admin','organizacion']::public.user_role[]))
  with check (bucket_id = 'case-photos-private' and public.can_access_case(case_id));

-- Events: append-only from app/triggers.
create policy case_events_select_case_access on public.case_events
  for select to authenticated
  using (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','voluntario','salud_albergue']::public.user_role[])));
create policy case_events_insert_case_access on public.case_events
  for insert to authenticated
  with check (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','voluntario','salud_albergue']::public.user_role[])));

-- Handovers / Transfers
create policy handovers_select_secure_roles on public.handovers
  for select to authenticated
  using (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])));
create policy handovers_insert_secure_roles on public.handovers
  for insert to authenticated
  with check (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])));

create policy transfers_select_secure_roles on public.transfers
  for select to authenticated
  using (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])));
create policy transfers_insert_secure_roles on public.transfers
  for insert to authenticated
  with check (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])));

-- Public reports: anonymous can insert only pending reports; moderation is private.
create policy public_reports_insert_public_pending on public.public_reports
  for insert to anon, authenticated
  with check (status = 'pendiente' and reviewed_by is null and reviewed_at is null and moderation_notes is null);
create policy public_reports_select_moderators on public.public_reports
  for select to authenticated
  using (public.is_admin() or public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[]));
create policy public_reports_update_moderators on public.public_reports
  for update to authenticated
  using (public.is_admin() or public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[]))
  with check (public.is_admin() or public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[]));

-- Audit logs: read-only to admins; org leads can read own org audit. Inserts only via security-definer triggers/server.
create policy audit_logs_select_admin_or_org on public.audit_logs
  for select to authenticated
  using (public.is_admin() or (organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion']::public.user_role[])));

-- ---------- Storage buckets and policies ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('case-photos-private', 'case-photos-private', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('public-report-uploads', 'public-report-uploads', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('handover-evidence-private', 'handover-evidence-private', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS is normally enabled by Supabase; ensure it is on.
alter table storage.objects enable row level security;

do $$
declare
  r record;
begin
  for r in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'ntv_%' loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy ntv_case_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'case-photos-private'
    and public.can_access_case(public.try_uuid((storage.foldername(name))[1]))
  );

create policy ntv_case_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'case-photos-private'
    and public.can_access_case(public.try_uuid((storage.foldername(name))[1]))
  );

create policy ntv_handover_evidence_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'handover-evidence-private'
    and exists (
      select 1 from public.handovers h
      where h.id = public.try_uuid((storage.foldername(name))[1])
        and (public.is_admin() or (h.organization_id = public.current_user_org_id() and public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])))
    )
  );

create policy ntv_handover_evidence_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'handover-evidence-private'
    and public.is_approved_role(array['admin','organizacion','salud_albergue']::public.user_role[])
  );

create policy ntv_public_report_upload_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'public-report-uploads');

create policy ntv_public_report_upload_select_moderators on storage.objects
  for select to authenticated
  using (bucket_id = 'public-report-uploads' and (public.is_admin() or public.is_approved_role(array['organizacion','salud_albergue']::public.user_role[])));

-- ---------- Grants ----------
grant usage on schema public to anon, authenticated;
grant execute on function public.get_public_case_by_code(text) to anon, authenticated;
grant execute on function public.get_current_profile() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_user_org_id() to authenticated;

grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.cases to authenticated;
grant select, insert, update on public.case_photos to authenticated;
grant select, insert on public.case_events to authenticated;
grant select, insert on public.handovers to authenticated;
grant select, insert on public.transfers to authenticated;
grant select, insert, update on public.public_reports to authenticated;
grant insert on public.public_reports to anon;
grant select on public.audit_logs to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;

commit;
