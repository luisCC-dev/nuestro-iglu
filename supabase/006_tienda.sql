-- 006: monedas y tienda. Las monedas se calculan en la BD a partir de lo que cada uno ha hecho.
-- Precios y reglas: mantener iguales que js/content.js (SHOP) y js/store.js (coinsEarned).

create table if not exists public.purchases (
  couple_id uuid not null references public.couples on delete cascade,
  slot text not null check (slot in ('a','b')),
  item text not null,
  price int not null,
  at timestamptz default now(),
  primary key (couple_id, slot, item)
);
alter table public.purchases enable row level security;
drop policy if exists "ver compras" on public.purchases;
create policy "ver compras" on public.purchases for select using (couple_id = public.my_couple());

alter table public.members add column if not exists style jsonb not null default '{}'::jsonb;
alter table public.couples add column if not exists bg text;

-- Desde la app solo se puede cambiar el nombre directamente; el estilo va por equip_item().
revoke update on public.members from authenticated, anon;
grant update (name) on public.members to authenticated;

create or replace function public.shop_price(p_item text) returns int
language sql immutable as $$
  select price from (values
    ('hat:beanie',30),('hat:party',40),('hat:flower',25),('hat:tophat',80),('hat:headphones',60),('hat:crown',120),
    ('acc:sunglasses',50),('acc:glasses',35),('acc:bowtie',30),('acc:necklace',45),
    ('color:mint',60),('color:pink',60),('color:sky',50),('color:black',40),('color:gold',150),
    ('bg:snow',60),('bg:sunset',70),('bg:beach',80),('bg:sakura',90),('bg:aurora',100),('bg:space',150)
  ) v(id, price) where id = p_item
$$;

create or replace function public.coins_earned(c uuid, s text) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(case e.kind
    when 'answer' then 10 + case when exists (select 1 from entries x where x.couple_id = e.couple_id
                                   and x.kind = 'answer' and x.day = e.day and x.slot <> e.slot) then 5 else 0 end
    when 'mood' then 5
    when 'game' then 10
    when 'likely' then 10
    when 'word' then 5
    when 'wordplay' then case e.data->>'result' when 'win' then 10 when 'lose' then 3 else 0 end
    when 'hug' then least(coalesce(jsonb_array_length(e.data->'items'), 0), 3)
    else 0 end), 0)::int
  from entries e where e.couple_id = c and e.slot = s
$$;

create or replace function public.my_wallet() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'earned', coins_earned(my_couple(), my_slot()),
    'spent', coalesce((select sum(price) from purchases where couple_id = my_couple() and slot = my_slot()), 0))
$$;

create or replace function public.buy_item(p_item text) returns int
language plpgsql security definer set search_path = public as $$
declare c uuid := my_couple(); s text := my_slot(); pr int := shop_price(p_item); bal int;
begin
  if c is null then raise exception 'no couple'; end if;
  if pr is null then raise exception 'unknown item'; end if;
  perform pg_advisory_xact_lock(hashtext(c::text || s));
  if exists (select 1 from purchases where couple_id = c and slot = s and item = p_item) then raise exception 'already owned'; end if;
  bal := coins_earned(c, s) - coalesce((select sum(price) from purchases where couple_id = c and slot = s), 0);
  if bal < pr then raise exception 'not enough coins'; end if;
  insert into purchases (couple_id, slot, item, price) values (c, s, p_item, pr);
  return bal - pr;
end $$;

-- Equipar o quitar (p_item null). Categoría = parte antes de ':' (hat, acc, color, bg).
create or replace function public.equip_item(p_cat text, p_item text) returns void
language plpgsql security definer set search_path = public as $$
declare c uuid := my_couple(); s text := my_slot();
begin
  if c is null then raise exception 'no couple'; end if;
  if p_cat not in ('hat','acc','color','bg') then raise exception 'bad category'; end if;
  if p_item is not null then
    if split_part(p_item, ':', 1) <> p_cat then raise exception 'bad category'; end if;
    if not exists (select 1 from purchases where couple_id = c and slot = s and item = p_item) then raise exception 'not owned'; end if;
  end if;
  if p_cat = 'bg' then
    update couples set bg = p_item where id = c;
  elsif p_item is null then
    update members set style = style - p_cat where user_id = auth.uid();
  else
    update members set style = jsonb_set(style, array[p_cat], to_jsonb(p_item)) where user_id = auth.uid();
  end if;
end $$;

revoke all on function public.buy_item(text) from public, anon;
revoke all on function public.equip_item(text, text) from public, anon;
revoke all on function public.my_wallet() from public, anon;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.equip_item(text, text) to authenticated;
grant execute on function public.my_wallet() to authenticated;

-- Tiempo real: que se vea el cambio de estilo y de fondo del otro
do $$ begin alter publication supabase_realtime add table public.members; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.couples; exception when duplicate_object then null; end $$;
