-- Funções de apoio (portadas do Supabase, sem dependência de auth).

-- Rate limit por janela deslizante, atômico via advisory lock por id.
-- Retorna allowed + reset_at. Uso na API:
--   select * from consume_rate_limit('llm:ip:1.2.3.4', 15, '10 minutes'::interval);
create or replace function consume_rate_limit(
  p_id     text,
  p_max    int,
  p_window interval
)
returns table (allowed boolean, reset_at timestamptz)
language plpgsql
as $$
declare
  v_count        int;
  v_window_start timestamptz := now() - p_window;
  v_oldest       timestamptz;
begin
  -- serializa concorrentes do mesmo id dentro da transação
  perform pg_advisory_xact_lock(hashtext(p_id));

  delete from rate_limit_hits where id = p_id and hit_at < v_window_start;
  select count(*) into v_count from rate_limit_hits where id = p_id;

  if v_count < p_max then
    insert into rate_limit_hits (id, hit_at) values (p_id, now());
    return query select true, now() + p_window;
  else
    select min(hit_at) into v_oldest from rate_limit_hits where id = p_id;
    return query select false, coalesce(v_oldest, now()) + p_window;
  end if;
end;
$$;

-- Agregações para o dashboard admin (últimos 14 dias para per_day).
create or replace function get_metrics()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'total_events', (select count(*) from events),
    'llm_total',    (select count(*) from events where type = 'llm_request'),
    'cache_hits',   (select count(*) from events
                       where type = 'llm_request'
                         and coalesce((payload->>'cache_hit')::boolean, false)),
    'rate_limited', (select count(*) from events
                       where type = 'llm_request'
                         and coalesce((payload->>'rate_limited')::boolean, false)),
    'errors',       (select count(*) from events
                       where type = 'llm_request'
                         and coalesce((payload->>'error')::boolean, false)),
    'by_type',      (select coalesce(jsonb_object_agg(type, c), '{}'::jsonb)
                       from (select type, count(*) c from events group by type) t),
    'per_day',      (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb)
                       from (select date_trunc('day', created_at)::date d, count(*) c
                               from events
                              where created_at >= now() - interval '14 days'
                              group by 1) t),
    'generated_at', now()
  );
$$;
