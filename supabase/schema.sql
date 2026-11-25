-- Nuestro Iglú: tablas y seguridad (pegar en Supabase > SQL Editor > Run).
-- Se puede ejecutar más de una vez.

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.members (
  user_id uuid primary key references auth.users on delete cascade,
  couple_id uuid not null references public.couples on delete cascade,
  slot text not null check (slot in ('a','b')),
  name text not null check (char_length(name) between 1 and 20),
  unique (couple_id, slot)
);

create table if not exists public.entries (
  couple_id uuid not null references public.couples on delete cascade,
  kind text not null check (kind in ('answer','mood','game')),
  day date not null,
  slot text not null check (slot in ('a','b')),
  data jsonb not null,
  updated_at timestamptz default now(),
  primary key (couple_id, kind, day, slot)
);

alter table public.couples enable row level security;
alter table public.members enable row level security;
alter table public.entries enable row level security;

-- Ayudantes (security definer para evitar recursión en las políticas)
create or replace function public.my_couple() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from members where user_id = auth.uid()
$$;

create or replace function public.my_slot() returns text
language sql stable security definer set search_path = public as $$
  select slot from members where user_id = auth.uid()
$$;

-- ¿He respondido yo ya este tipo/día? (para ocultar lo del otro hasta entonces)
create or replace function public.i_did(k text, d date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from entries
    where couple_id = my_couple() and kind = k and day = d and slot = my_slot())
$$;

drop policy if exists "ver mi pareja" on public.couples;
create policy "ver mi pareja" on public.couples for select using (id = public.my_couple());

drop policy if exists "ver miembros" on public.members;
create policy "ver miembros" on public.members for select using (couple_id = public.my_couple());
drop policy if exists "cambiar mi nombre" on public.members;
create policy "cambiar mi nombre" on public.members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = public.my_couple() and slot = public.my_slot());

-- Lo mío siempre; lo del otro: el diario siempre, la pregunta y el juego solo si yo ya he hecho el mío.
drop policy if exists "leer entradas" on public.entries;
create policy "leer entradas" on public.entries for select using (
  couple_id = public.my_couple()
  and (slot = public.my_slot() or kind = 'mood' or public.i_did(kind, day))
);
drop policy if exists "escribir mis entradas" on public.entries;
create policy "escribir mis entradas" on public.entries for insert
  with check (couple_id = public.my_couple() and slot = public.my_slot());
drop policy if exists "editar mis entradas" on public.entries;
create policy "editar mis entradas" on public.entries for update
  using (couple_id = public.my_couple() and slot = public.my_slot())
  with check (couple_id = public.my_couple() and slot = public.my_slot());

-- Saber si el otro ya respondió (sin ver el contenido)
create or replace function public.partner_done(k text, d date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from entries
    where couple_id = my_couple() and kind = k and day = d and slot <> my_slot())
$$;

-- Crear pareja (quien crea es "a") y devolver el código para el otro
create or replace function public.create_couple(p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare c_id uuid; c_code text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then raise exception 'already in a couple'; end if;
  c_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
  insert into couples (code) values (c_code) returning id into c_id;
  insert into members (user_id, couple_id, slot, name) values (auth.uid(), c_id, 'a', trim(p_name));
  return c_code;
end $$;

-- Unirse con el código (quien se une es "b")
create or replace function public.join_couple(p_code text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare c_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from members where user_id = auth.uid()) then raise exception 'already in a couple'; end if;
  select id into c_id from couples where code = upper(trim(p_code));
  if c_id is null then raise exception 'bad code'; end if;
  if exists (select 1 from members where couple_id = c_id and slot = 'b') then raise exception 'couple full'; end if;
  insert into members (user_id, couple_id, slot, name) values (auth.uid(), c_id, 'b', trim(p_name));
end $$;

revoke all on function public.create_couple(text) from public, anon;
revoke all on function public.join_couple(text, text) from public, anon;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text, text) to authenticated;
grant execute on function public.partner_done(text, date) to authenticated;

-- Tiempo real: avisar cuando el otro escribe
do $$ begin
  alter publication supabase_realtime add table public.entries;
exception when duplicate_object then null; end $$;
