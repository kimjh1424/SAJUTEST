create table if not exists public.saju_readings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  delete_hash text not null unique,
  self_input jsonb not null,
  partner_input jsonb,
  self_chart jsonb not null,
  partner_chart jsonb,
  reading text not null,
  consent_version text not null,
  partner_consent boolean not null default false
);
alter table public.saju_readings enable row level security;
revoke all on public.saju_readings from anon, authenticated;
grant all on public.saju_readings to service_role;

create table if not exists public.saju_quotas (
  day date not null,
  bucket text not null,
  count integer not null default 0,
  primary key(day,bucket)
);
alter table public.saju_quotas enable row level security;
revoke all on public.saju_quotas from anon, authenticated;
grant all on public.saju_quotas to service_role;

-- Serialize increments so parallel requests cannot exceed the daily cap.
create or replace function public.consume_saju_quota(p_bucket text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare total_count integer; client_count integer; today date := (now() at time zone 'UTC')::date;
begin
  if p_bucket !~ '^[0-9a-f]{64}$' then return false; end if;
  perform pg_advisory_xact_lock(73159021);
  select count into total_count from public.saju_quotas where day=today and bucket='global';
  select count into client_count from public.saju_quotas where day=today and bucket=p_bucket;
  if coalesce(total_count,0)>=200 or coalesce(client_count,0)>=10 then return false; end if;
  insert into public.saju_quotas(day,bucket,count) values(today,'global',1)
    on conflict(day,bucket) do update set count=public.saju_quotas.count+1;
  insert into public.saju_quotas(day,bucket,count) values(today,p_bucket,1)
    on conflict(day,bucket) do update set count=public.saju_quotas.count+1;
  delete from public.saju_quotas where day < today-7;
  return true;
end; $$;
revoke all on function public.consume_saju_quota(text) from public,anon,authenticated;
grant execute on function public.consume_saju_quota(text) to service_role;
