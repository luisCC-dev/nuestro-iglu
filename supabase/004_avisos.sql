-- 004: notificaciones push. Ejecutar en SQL Editor.

-- Móviles suscritos a los avisos
create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  couple_id uuid not null references public.couples on delete cascade,
  slot text not null check (slot in ('a','b')),
  p256dh text not null,
  auth text not null,
  remind_hour int not null default 21 check (remind_hour between 0 and 23),
  tz text not null default 'Europe/Madrid',
  last_daily date,
  created_at timestamptz default now()
);
alter table public.push_subs enable row level security;

drop policy if exists "mis avisos leer" on public.push_subs;
create policy "mis avisos leer" on public.push_subs for select using (user_id = auth.uid());
drop policy if exists "mis avisos crear" on public.push_subs;
create policy "mis avisos crear" on public.push_subs for insert
  with check (user_id = auth.uid() and couple_id = public.my_couple() and slot = public.my_slot());
drop policy if exists "mis avisos cambiar" on public.push_subs;
create policy "mis avisos cambiar" on public.push_subs for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and couple_id = public.my_couple() and slot = public.my_slot());
drop policy if exists "mis avisos borrar" on public.push_subs;
create policy "mis avisos borrar" on public.push_subs for delete using (user_id = auth.uid());

-- Claves VAPID: las crea la función la primera vez. Sin políticas = nadie las lee desde la app.
create table if not exists public.push_config (
  id int primary key,
  public_key text not null,
  private_key text not null
);
alter table public.push_config enable row level security;
