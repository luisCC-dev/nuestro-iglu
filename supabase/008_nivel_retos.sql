-- 008: nivel del iglú (XP de pareja) y retos semanales. Mantener igual que js/store.js (coupleXp, weekMetrics)
-- y js/content.js (CHALLENGES, LEVELS).

create table if not exists public.challenge_claims (
  couple_id uuid not null references public.couples on delete cascade,
  week date not null,
  idx int not null check (idx between 0 and 2),
  at timestamptz default now(),
  primary key (couple_id, week, idx)
);
alter table public.challenge_claims enable row level security;
drop policy if exists "ver retos" on public.challenge_claims;
create policy "ver retos" on public.challenge_claims for select using (couple_id = public.my_couple());

-- Métricas de la pareja en la semana que empieza el lunes m
create or replace function public.week_metrics(c uuid, m date) returns json
language sql stable security definer set search_path = public as $$
  with e as (select * from entries where couple_id = c and day between m and m + 6)
  select json_build_object(
    'both_answers', (select count(*) from (select day from e where kind = 'answer' group by day having count(distinct slot) = 2) x),
    'moods_both',   (select count(*) from (select day from e where kind = 'mood' group by day having count(distinct slot) = 2) x),
    'hugs',         (select coalesce(sum(jsonb_array_length(data->'items')), 0) from e where kind = 'hug'),
    'games',        (select count(*) from e where kind in ('game','likely')),
    'words',        (select count(*) from e where kind = 'wordplay' and data->>'result' = 'win'),
    'gifts',        (select count(*) from e where kind = 'gift'),
    'answers',      (select count(*) from e where kind = 'answer')
  )
$$;

-- Reto i (0..2) de la semana m: rota por la lista según el número de semana
create or replace function public.challenge_goal(m date, i int, out metric text, out goal int)
language sql immutable as $$
  select p.metric, p.goal from (values
    (0,'both_answers',5),(1,'moods_both',4),(2,'hugs',10),(3,'games',6),(4,'words',2),(5,'gifts',8),(6,'answers',10)
  ) p(n, metric, goal)
  where p.n = ((((m - date '2024-01-01') / 7) * 3 + i) % 7)
$$;

create or replace function public.couple_xp(c uuid) returns int
language sql stable security definer set search_path = public as $$
  select (
    coalesce((select sum(case kind
      when 'answer' then 10 when 'mood' then 5 when 'game' then 5 when 'likely' then 5 when 'word' then 3
      when 'wordplay' then case when data->>'result' is not null then 5 else 0 end
      when 'hug' then least(coalesce(jsonb_array_length(data->'items'), 0), 3)
      else 0 end) from entries where couple_id = c), 0)
    + 10 * (select count(*) from (select day from entries where couple_id = c and kind = 'answer' group by day having count(distinct slot) = 2) x)
    + 30 * (select count(*) from challenge_claims where couple_id = c)
  )::int
$$;

create or replace function public.couple_status(p_monday date) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'xp', couple_xp(my_couple()),
    'week', week_metrics(my_couple(), p_monday),
    'claims', coalesce((select json_agg(idx) from challenge_claims where couple_id = my_couple() and week = p_monday), '[]'::json)
  )
$$;

create or replace function public.claim_challenge(p_monday date, p_idx int) returns void
language plpgsql security definer set search_path = public as $$
declare c uuid := my_couple(); mt text; gl int;
begin
  if c is null then raise exception 'no couple'; end if;
  if extract(isodow from p_monday) <> 1 or p_monday < current_date - 13 or p_monday > current_date + 1 then raise exception 'bad week'; end if;
  if p_idx not between 0 and 2 then raise exception 'bad challenge'; end if;
  select metric, goal into mt, gl from challenge_goal(p_monday, p_idx);
  if coalesce((week_metrics(c, p_monday)->>mt)::int, 0) < gl then raise exception 'not done'; end if;
  insert into challenge_claims (couple_id, week, idx) values (c, p_monday, p_idx) on conflict do nothing;
end $$;

-- Monedas: + 20 a cada uno por reto reclamado
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
    else 0 end), 0)::int
    + achievement_bonus(c, s)
    + 20 * (select count(*) from challenge_claims where couple_id = c)::int
  from entries e where e.couple_id = c and e.slot = s
$$;

revoke all on function public.couple_status(date) from public, anon;
revoke all on function public.claim_challenge(date, int) from public, anon;
grant execute on function public.couple_status(date) to authenticated;
grant execute on function public.claim_challenge(date, int) to authenticated;
