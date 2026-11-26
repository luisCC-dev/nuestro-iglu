-- 010: Dibuja y adivina. kind 'draw' (dibujo: {word, strokes}) y 'drawguess' (intentos: {tries, result}).
-- Igual que js/store.js (coinsEarned, coupleXp, achievementMetrics) y js/content.js (ACHIEVEMENTS).

alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('answer','mood','game','hug','likely','word','wordplay','gift','fish','draw','drawguess'));

drop policy if exists "leer entradas" on public.entries;
create policy "leer entradas" on public.entries for select using (
  couple_id = public.my_couple()
  and (slot = public.my_slot() or kind in ('mood','hug','word','wordplay','draw','drawguess') or public.i_did(kind, day))
);

create or replace function public.achievement_metrics(c uuid, s text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'answers', (select count(*) from entries where couple_id = c and slot = s and kind = 'answer'),
    'moods',   (select count(*) from entries where couple_id = c and slot = s and kind = 'mood'),
    'games',   (select count(*) from entries where couple_id = c and slot = s and kind in ('game','likely')),
    'hugs',    (select coalesce(sum(jsonb_array_length(data->'items')), 0) from entries where couple_id = c and slot = s and kind = 'hug'),
    'wins',    (select count(*) from entries where couple_id = c and slot = s and kind = 'wordplay' and data->>'result' = 'win'),
    'buys',    (select count(*) from purchases where couple_id = c and slot = s),
    'fish',    (select coalesce(sum(fish_count(data->'casts')), 0) from entries where couple_id = c and slot = s and kind = 'fish'),
    'draws',   (select count(*) from entries where couple_id = c and slot = s and kind = 'draw'),
    'streak',  (with d as (select day from entries where couple_id = c and kind = 'answer' group by day having count(distinct slot) = 2),
                     g as (select day - (row_number() over (order by day))::int as grp from d)
                select coalesce(max(n), 0) from (select count(*) n from g group by grp) x)
  )
$$;

create or replace function public.achievement_bonus(c uuid, s text) returns int
language sql stable security definer set search_path = public as $$
  with m as (select achievement_metrics(c, s) j)
  select coalesce(sum(t.reward), 0)::int
  from m, (values
    ('answers', 1, 5), ('answers', 7, 20), ('answers', 30, 60),
    ('moods', 7, 20), ('games', 10, 30), ('hugs', 20, 20), ('wins', 5, 30),
    ('streak', 7, 40), ('streak', 30, 100), ('buys', 5, 25), ('fish', 25, 30), ('draws', 10, 25)
  ) t(metric, goal, reward)
  where (m.j->>t.metric)::int >= t.goal
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
    when 'gift' then gift_amount(e.couple_id, e.day, e.slot)
    when 'fish' then fish_coins(e.couple_id, e.day, e.slot, e.data->'casts')
    when 'draw' then 5 + case when exists (select 1 from entries x where x.couple_id = e.couple_id and x.kind = 'drawguess'
                                  and x.day = e.day and x.slot <> e.slot and x.data->>'result' = 'win') then 5 else 0 end
    when 'drawguess' then case e.data->>'result' when 'win' then 10 when 'lose' then 2 else 0 end
    else 0 end), 0)::int
    + achievement_bonus(c, s)
    + 20 * (select count(*) from challenge_claims where couple_id = c)::int
  from entries e where e.couple_id = c and e.slot = s
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
  )::int
$$;
