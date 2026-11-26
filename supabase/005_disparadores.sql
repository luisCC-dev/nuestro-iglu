-- 005: llamar a la función "push" cuando alguien guarda algo, y cada hora para el recordatorio.
create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public.notify_entry() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://xlknnmjkibvqklrvrxti.supabase.co/functions/v1/push',
    body := jsonb_build_object('mode','event','couple_id',new.couple_id,'kind',new.kind,'day',new.day,'slot',new.slot),
    headers := '{"Content-Type":"application/json"}'::jsonb
  );
  return new;
end $$;

drop trigger if exists entries_notify on public.entries;
create trigger entries_notify after insert or update on public.entries
  for each row execute function public.notify_entry();

select cron.unschedule(jobid) from cron.job where jobname = 'iglu-daily';
select cron.schedule('iglu-daily', '0 * * * *',
  $c$ select net.http_post(url := 'https://xlknnmjkibvqklrvrxti.supabase.co/functions/v1/push',
       body := '{"mode":"daily"}'::jsonb, headers := '{"Content-Type":"application/json"}'::jsonb) $c$);
