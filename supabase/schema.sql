-- PhotoRecord: esquema para Supabase (SQL Editor > New query > Run).
-- Antes: Authentication > Providers > Email: desactiva "Allow new users to sign up"
-- y crea a mano los dos usuarios (tú y tu pareja) en Authentication > Users.

-- 1) Lista de personas autorizadas (solo vosotros dos)
create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default ''
);

-- 2) Álbumes: uno por mes, el id es "AAAA-MM"
create table if not exists public.albums (
  id text primary key check (id ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  name text not null,
  color text not null check (color in ('rose','sky','amber','violet','emerald','slate')),
  emoji text not null default '📷',
  description text not null default '',
  favorite boolean not null default false,
  cover_id uuid,
  created_at timestamptz not null default now()
);

-- 3) Recuerdos: foto en Storage (photo_path) o URL externa (photo_url); los collages
--    no tienen foto propia y guardan su configuración en el JSON "collage".
create table if not exists public.memories (
  id uuid primary key,
  date date not null,
  location text not null,
  note text not null,
  photo_path text,
  photo_url text,
  collage jsonb,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  check (photo_path is not null or photo_url is not null or collage is not null)
);
create index if not exists memories_date_idx on public.memories (date desc);

-- Seguridad: solo los miembros leen y escriben
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where user_id = auth.uid()) $$;

alter table public.members enable row level security;
alter table public.albums enable row level security;
alter table public.memories enable row level security;

create policy "members read members" on public.members for select to authenticated using (public.is_member());
create policy "members all albums" on public.albums for all to authenticated using (public.is_member()) with check (public.is_member());
create policy "members all memories" on public.memories for all to authenticated using (public.is_member()) with check (public.is_member());

-- Permisos de tabla para el rol de la API (RLS decide después quién ve qué)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.albums, public.memories to authenticated;
grant select on public.members to authenticated;
grant execute on function public.is_member() to authenticated;

-- 4) Bucket privado para las fotos WebP
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/webp','image/jpeg'])
on conflict (id) do nothing;

create policy "members read photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member());
create policy "members upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_member());
create policy "members delete photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_member());

-- 5) Después de crear los dos usuarios, añádelos (sustituye los correos):
-- insert into public.members (user_id, display_name)
-- select id, split_part(email, '@', 1) from auth.users where email in ('tu@correo.com', 'pareja@correo.com');
