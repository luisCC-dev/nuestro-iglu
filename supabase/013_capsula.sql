-- 013: cápsula del tiempo. Cartas que la pareja no puede leer hasta open_on.
-- La tabla no se lee directamente: list_capsules() devuelve el texto solo si ya se puede abrir (o si es tuya).

create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.my_couple() references public.couples on delete cascade,
  from_slot text not null default public.my_slot() check (from_slot in ('a','b')),
  title text not null check (char_length(title) between 1 and 60),
  body text not null check (char_length(body) between 1 and 2000),
  open_on date not null,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.capsules enable row level security;
-- Sin política de lectura: nadie lee la tabla directamente.
drop policy if exists "capsula crear" on public.capsules;
create policy "capsula crear" on public.capsules for insert
  with check (couple_id = public.my_couple() and from_slot = public.my_slot() and open_on > current_date);
drop policy if exists "capsula borrar" on public.capsules;
create policy "capsula borrar" on public.capsules for delete using (couple_id = public.my_couple() and from_slot = public.my_slot());

-- p_today: fecha local del móvil (se acepta como mucho 1 día por delante del servidor, por las zonas horarias)
create or replace function public.list_capsules(p_today date) returns table (
  id uuid, from_slot text, title text, body text, open_on date, opened_at timestamptz, created_at timestamptz, locked boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.from_slot, c.title,
    case when c.from_slot = my_slot() or c.open_on <= least(p_today, current_date + 1) then c.body end,
    c.open_on, c.opened_at, c.created_at,
    not (c.open_on <= least(p_today, current_date + 1))
  from capsules c where c.couple_id = my_couple() order by c.open_on
$$;

create or replace function public.open_capsule(p_id uuid, p_today date) returns void
language sql security definer set search_path = public as $$
  update capsules set opened_at = now()
  where id = p_id and couple_id = my_couple() and from_slot <> my_slot()
    and open_on <= least(p_today, current_date + 1) and opened_at is null
$$;

revoke all on function public.list_capsules(date) from public, anon;
revoke all on function public.open_capsule(uuid, date) from public, anon;
grant execute on function public.list_capsules(date) to authenticated;
grant execute on function public.open_capsule(uuid, date) to authenticated;
