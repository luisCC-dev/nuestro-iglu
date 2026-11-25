-- 002: mimos (kind 'hug') + borrar el iglú. Se puede ejecutar más de una vez.

alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check check (kind in ('answer','mood','game','hug'));

-- Los mimos y el diario se ven siempre; pregunta y juego solo tras hacer el tuyo.
drop policy if exists "leer entradas" on public.entries;
create policy "leer entradas" on public.entries for select using (
  couple_id = public.my_couple()
  and (slot = public.my_slot() or kind in ('mood','hug') or public.i_did(kind, day))
);

-- Borra el iglú entero (pareja, miembros y todas las entradas, por cascada).
create or replace function public.delete_my_couple() returns void
language plpgsql security definer set search_path = public as $$
declare c uuid := my_couple();
begin
  if c is null then raise exception 'no couple'; end if;
  delete from couples where id = c;
end $$;

revoke all on function public.delete_my_couple() from public, anon;
grant execute on function public.delete_my_couple() to authenticated;
