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

drop policy if exists "members read members" on public.members;
drop policy if exists "members all albums" on public.albums;
drop policy if exists "members all memories" on public.memories;
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

drop policy if exists "members read photos" on storage.objects;
drop policy if exists "members upload photos" on storage.objects;
drop policy if exists "members delete photos" on storage.objects;
create policy "members read photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member());
create policy "members upload photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_member());
create policy "members delete photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_member());

-- 4b) Puntos y recompensas compartidas (un único bote para los dos)
create table if not exists public.shared_points (
  id uuid primary key default gen_random_uuid(),
  total_points int not null default 0 check (total_points >= 0),
  updated_at timestamptz not null default now()
);
-- Garantiza una sola fila de saldo
create unique index if not exists shared_points_single_row on public.shared_points ((true));
insert into public.shared_points (total_points) values (0) on conflict do nothing;

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  amount int not null,
  reason text not null,
  type varchar(20) not null check (type in ('EARN', 'REDEEM', 'BONUS')),
  created_at timestamptz not null default now()
);
create index if not exists point_transactions_created_idx on public.point_transactions (created_at desc);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title varchar(150) not null,
  description text,
  points_cost int not null check (points_cost > 0),
  tier int not null check (tier in (1, 2, 3)),
  icon varchar(10) default '🎁',
  status varchar(20) not null default 'AVAILABLE' check (status in ('AVAILABLE', 'PENDING', 'COMPLETED')),
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  completed_at timestamptz
);

alter table public.shared_points enable row level security;
alter table public.point_transactions enable row level security;
alter table public.rewards enable row level security;

-- Lectura para miembros; los saldos y canjes solo cambian mediante las funciones de abajo
drop policy if exists "members read shared_points" on public.shared_points;
drop policy if exists "members read point_transactions" on public.point_transactions;
drop policy if exists "members read rewards" on public.rewards;
drop policy if exists "members insert rewards" on public.rewards;
create policy "members read shared_points" on public.shared_points for select to authenticated using (public.is_member());
create policy "members read point_transactions" on public.point_transactions for select to authenticated using (public.is_member());
create policy "members read rewards" on public.rewards for select to authenticated using (public.is_member());
create policy "members insert rewards" on public.rewards for insert to authenticated
  with check (public.is_member() and status = 'AVAILABLE');
grant select on public.shared_points, public.point_transactions, public.rewards to authenticated;
grant insert on public.rewards to authenticated;

create or replace function public.add_points(p_amount int, p_reason text, p_type text default 'EARN')
returns int language plpgsql security definer set search_path = public as $$
declare v_total int;
begin
  if not public.is_member() then raise exception 'No autorizado'; end if;
  if p_amount <= 0 or p_type not in ('EARN', 'BONUS') then raise exception 'Puntos no válidos'; end if;
  update public.shared_points set total_points = total_points + p_amount, updated_at = now()
    where id = (select id from public.shared_points limit 1)
    returning total_points into v_total;
  if not found then raise exception 'No existe el saldo compartido'; end if;
  insert into public.point_transactions (user_id, amount, reason, type) values (auth.uid(), p_amount, p_reason, p_type);
  return v_total;
end $$;

create or replace function public.redeem_reward(p_reward_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_reward public.rewards; v_total int;
begin
  if not public.is_member() then raise exception 'No autorizado'; end if;
  select * into v_reward from public.rewards where id = p_reward_id and status = 'AVAILABLE' for update;
  if not found then raise exception 'La recompensa ya no está disponible'; end if;
  update public.shared_points set total_points = total_points - v_reward.points_cost, updated_at = now()
    where total_points >= v_reward.points_cost returning total_points into v_total;
  if not found then raise exception 'Puntos insuficientes'; end if;
  update public.rewards set status = 'PENDING', redeemed_by = auth.uid(), redeemed_at = now() where id = p_reward_id;
  insert into public.point_transactions (user_id, amount, reason, type)
    values (auth.uid(), -v_reward.points_cost, 'Canje: ' || v_reward.title, 'REDEEM');
  return v_total;
end $$;

create or replace function public.complete_reward(p_reward_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_title text; v_total int;
begin
  if not public.is_member() then raise exception 'No autorizado'; end if;
  update public.rewards set status = 'COMPLETED', completed_at = now()
    where id = p_reward_id and status = 'PENDING' returning title into v_title;
  if not found then raise exception 'La recompensa no está pendiente'; end if;
  update public.shared_points set total_points = total_points + 20, updated_at = now()
    where id = (select id from public.shared_points limit 1)
    returning total_points into v_total;
  if not found then raise exception 'No existe el saldo compartido'; end if;
  insert into public.point_transactions (user_id, amount, reason, type)
    values (auth.uid(), 20, 'Plan disfrutado: ' || v_title, 'BONUS');
  return v_total;
end $$;

grant execute on function public.add_points(int, text, text), public.redeem_reward(uuid), public.complete_reward(uuid) to authenticated;

-- Catálogo inicial
insert into public.rewards (title, description, points_cost, tier, icon)
select * from (values
  ('Maratón de pelis/serie', 'Noche de cine casero con picoteo.', 50, 1, '🎬'),
  ('Desayuno o merienda especial', 'Café o tostada con calma, juntos.', 75, 1, '☕'),
  ('Salida a por helado', 'Vuestra heladería o pastelería favorita.', 100, 1, '🍨'),
  ('Tarde de DJ y cocina', 'Cocinar juntos con vuestra lista de música.', 125, 1, '🎵'),
  ('Noche de juegos de mesa', 'Partida en casa con snacks y copas.', 150, 1, '🎲'),
  ('Cena casera gourmet', 'Receta elaborada preparada entre los dos.', 250, 2, '🍝'),
  ('Cena y cócteles fuera', 'Tapas o copas en un sitio especial.', 350, 2, '🍹'),
  ('Escapada o picnic de día completo', 'Un día en el campo o en un pueblo cercano.', 450, 2, '🌲'),
  ('Visita cultural', 'Museo o exposición nuevos.', 500, 2, '🏛️'),
  ('Cena en restaurante especial', 'Ese sitio pendiente de probar.', 800, 3, '🍷'),
  ('Escapada de fin de semana', 'Noche en casa rural o hotel con encanto.', 1200, 3, '🏨'),
  ('Entradas a concierto o teatro', 'Un espectáculo juntos.', 1500, 3, '🎟️')
) as v(title, description, points_cost, tier, icon)
where not exists (select 1 from public.rewards);

-- 5) Después de crear los dos usuarios, añádelos (sustituye los correos):
-- insert into public.members (user_id, display_name)
-- select id, split_part(email, '@', 1) from auth.users where email in ('tu@correo.com', 'pareja@correo.com');
