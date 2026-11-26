-- 011: regalos a la pareja. Una compra puede pagarla la otra persona (paid_by) y llevar nota.
-- El gasto de monedas cuenta para quien paga (paid_by), no para quien lo recibe (slot).

alter table public.purchases add column if not exists paid_by text check (paid_by in ('a','b'));
alter table public.purchases add column if not exists note text check (char_length(note) <= 120);
alter table public.purchases add column if not exists opened boolean not null default true;
update public.purchases set paid_by = slot where paid_by is null;

create or replace function public.spent_by(c uuid, s text) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(price), 0)::int from purchases where couple_id = c and coalesce(paid_by, slot) = s
$$;

create or replace function public.my_wallet() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('earned', coins_earned(my_couple(), my_slot()), 'spent', spent_by(my_couple(), my_slot()))
$$;

create or replace function public.buy_item(p_item text) returns int
language plpgsql security definer set search_path = public as $$
declare c uuid := my_couple(); s text := my_slot(); pr int := shop_price(p_item); bal int;
begin
  if c is null then raise exception 'no couple'; end if;
  if pr is null then raise exception 'unknown item'; end if;
  perform pg_advisory_xact_lock(hashtext(c::text || s));
  if exists (select 1 from purchases where couple_id = c and slot = s and item = p_item) then raise exception 'already owned'; end if;
  bal := coins_earned(c, s) - spent_by(c, s);
  if bal < pr then raise exception 'not enough coins'; end if;
  insert into purchases (couple_id, slot, item, price, paid_by) values (c, s, p_item, pr, s);
  return bal - pr;
end $$;

-- Regalar un objeto a la pareja (pago yo, lo recibe el otro)
create or replace function public.gift_item(p_item text, p_note text) returns int
language plpgsql security definer set search_path = public as $$
declare c uuid := my_couple(); s text := my_slot(); o text; pr int := shop_price(p_item); bal int;
begin
  if c is null then raise exception 'no couple'; end if;
  if pr is null then raise exception 'unknown item'; end if;
  o := case s when 'a' then 'b' else 'a' end;
  if not exists (select 1 from members where couple_id = c and slot = o) then raise exception 'no partner'; end if;
  perform pg_advisory_xact_lock(hashtext(c::text || s));
  if exists (select 1 from purchases where couple_id = c and slot = o and item = p_item) then raise exception 'partner owns'; end if;
  bal := coins_earned(c, s) - spent_by(c, s);
  if bal < pr then raise exception 'not enough coins'; end if;
  insert into purchases (couple_id, slot, item, price, paid_by, note, opened)
    values (c, o, p_item, pr, s, nullif(left(trim(coalesce(p_note, '')), 120), ''), false);
  return bal - pr;
end $$;

-- Abrir un regalo recibido
create or replace function public.open_gift(p_item text) returns void
language sql security definer set search_path = public as $$
  update purchases set opened = true where couple_id = my_couple() and slot = my_slot() and item = p_item
$$;

revoke all on function public.gift_item(text, text) from public, anon;
revoke all on function public.open_gift(text) from public, anon;
grant execute on function public.gift_item(text, text) to authenticated;
grant execute on function public.open_gift(text) to authenticated;

-- Aviso push al recibir un regalo
create or replace function public.notify_present() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.paid_by is not null and new.paid_by <> new.slot then
    perform net.http_post(
      url := 'https://xlknnmjkibvqklrvrxti.supabase.co/functions/v1/push',
      body := jsonb_build_object('mode','present','couple_id',new.couple_id,'slot',new.slot,'item',new.item),
      headers := '{"Content-Type":"application/json"}'::jsonb);
  end if;
  return new;
end $$;
drop trigger if exists purchases_notify on public.purchases;
create trigger purchases_notify after insert on public.purchases for each row execute function public.notify_present();

do $$ begin alter publication supabase_realtime add table public.purchases; exception when duplicate_object then null; end $$;
