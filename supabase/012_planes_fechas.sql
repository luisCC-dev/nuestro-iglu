-- 012: lista de planes juntos y fechas especiales (cuenta atrás). Los dos pueden añadir, completar y borrar.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple() references public.couples on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  emoji text not null default '✨' check (char_length(emoji) <= 8),
  created_by text not null default public.my_slot() check (created_by in ('a','b')),
  created_at timestamptz not null default now(),
  done_at timestamptz,
  done_by text check (done_by in ('a','b'))
);
alter table public.plans enable row level security;
drop policy if exists "planes ver" on public.plans;
create policy "planes ver" on public.plans for select using (couple_id = public.my_couple());
drop policy if exists "planes crear" on public.plans;
create policy "planes crear" on public.plans for insert with check (couple_id = public.my_couple() and created_by = public.my_slot());
drop policy if exists "planes cambiar" on public.plans;
create policy "planes cambiar" on public.plans for update using (couple_id = public.my_couple()) with check (couple_id = public.my_couple());
drop policy if exists "planes borrar" on public.plans;
create policy "planes borrar" on public.plans for delete using (couple_id = public.my_couple());

create table if not exists public.special_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple() references public.couples on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  emoji text not null default '💖' check (char_length(emoji) <= 8),
  day date not null,
  yearly boolean not null default false,
  created_by text not null default public.my_slot() check (created_by in ('a','b')),
  created_at timestamptz not null default now()
);
alter table public.special_dates enable row level security;
drop policy if exists "fechas ver" on public.special_dates;
create policy "fechas ver" on public.special_dates for select using (couple_id = public.my_couple());
drop policy if exists "fechas crear" on public.special_dates;
create policy "fechas crear" on public.special_dates for insert with check (couple_id = public.my_couple() and created_by = public.my_slot());
drop policy if exists "fechas cambiar" on public.special_dates;
create policy "fechas cambiar" on public.special_dates for update using (couple_id = public.my_couple()) with check (couple_id = public.my_couple());
drop policy if exists "fechas borrar" on public.special_dates;
create policy "fechas borrar" on public.special_dates for delete using (couple_id = public.my_couple());

-- XP: +20 por plan cumplido (máx. 2 por semana; debe llevar al menos 1 hora creado)
create or replace function public.plans_xp(c uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(least(n, 2)) * 20, 0)::int from (
    select date_trunc('week', done_at) w, count(*) n from plans
    where couple_id = c and done_at is not null and done_at > created_at + interval '1 hour' group by 1) x
$$;

create or replace function public.couple_xp(c uuid) returns int
language sql stable security definer set search_path = public as $$
  select (
    coalesce((select sum(case kind
      when 'answer' then 10 when 'mood' then 5 when 'game' then 5 when 'likely' then 5 when 'word' then 3
      when 'wordplay' then case when data->>'result' is not null then 5 else 0 end
      when 'hug' then least(coalesce(jsonb_array_length(data->'items'), 0), 3)
      when 'fish' then 2 * fish_count(data->'casts')
      when 'draw' then 3
      when 'drawguess' then case when data->>'result' is not null then 5 else 0 end
      else 0 end) from entries where couple_id = c), 0)
    + 10 * (select count(*) from (select day from entries where couple_id = c and kind = 'answer' group by day having count(distinct slot) = 2) x)
    + 30 * (select count(*) from challenge_claims where couple_id = c)
    + plans_xp(c)
  )::int
$$;

do $$ begin alter publication supabase_realtime add table public.plans; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.special_dates; exception when duplicate_object then null; end $$;
