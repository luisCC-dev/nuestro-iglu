-- 003: nuevos juegos. likely = "¿Quién es más probable?" (oculto hasta jugar los dos),
-- word = palabra secreta que pone uno, wordplay = progreso de quien adivina (ambos visibles).
alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('answer','mood','game','hug','likely','word','wordplay'));

drop policy if exists "leer entradas" on public.entries;
create policy "leer entradas" on public.entries for select using (
  couple_id = public.my_couple()
  and (slot = public.my_slot() or kind in ('mood','hug','word','wordplay') or public.i_did(kind, day))
);
