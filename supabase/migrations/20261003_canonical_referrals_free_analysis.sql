-- Canonical referral and free-analysis model.
-- Prepare only: do not apply automatically to production.
-- This migration supersedes the earlier overlapping referral drafts.

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  constraint referral_codes_user_unique unique (user_id),
  constraint referral_codes_format check (code ~ '^[A-Z2-9]{8}$')
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null references public.referral_codes(code),
  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'rewarded', 'rejected')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  constraint referrals_no_self check (referrer_user_id <> referred_user_id),
  constraint referrals_referred_unique unique (referred_user_id)
);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid not null references public.referrals(id) on delete cascade,
  reward_type text not null check (reward_type = 'free_analysis'),
  status text not null default 'available'
    check (status in ('available', 'used', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint referral_rewards_once unique (referral_id, reward_type)
);

create index if not exists referral_codes_user_idx
  on public.referral_codes(user_id);
create index if not exists referrals_referrer_status_idx
  on public.referrals(referrer_user_id, status, created_at desc);
create index if not exists referrals_code_idx
  on public.referrals(referral_code);
create index if not exists referral_rewards_user_status_idx
  on public.referral_rewards(user_id, status, created_at desc);

create table if not exists public.free_analysis_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  source text not null check (source in ('initial', 'referral_reward', 'usage')),
  reference_id uuid,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint free_analysis_ledger_idempotency_unique unique (idempotency_key)
);

create index if not exists free_analysis_ledger_user_idx
  on public.free_analysis_ledger(user_id, created_at desc);
create unique index if not exists free_analysis_initial_once
  on public.free_analysis_ledger(user_id, source)
  where source = 'initial';
create unique index if not exists free_analysis_reward_once
  on public.free_analysis_ledger(reference_id, source)
  where source = 'referral_reward' and reference_id is not null;

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.free_analysis_ledger enable row level security;

drop policy if exists referral_codes_select_own on public.referral_codes;
create policy referral_codes_select_own on public.referral_codes
  for select using (auth.uid() = user_id);

drop policy if exists referrals_select_involved on public.referrals;
create policy referrals_select_involved on public.referrals
  for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

drop policy if exists referral_rewards_select_own on public.referral_rewards;
create policy referral_rewards_select_own on public.referral_rewards
  for select using (auth.uid() = user_id);

drop policy if exists free_analysis_ledger_select_own on public.free_analysis_ledger;
create policy free_analysis_ledger_select_own on public.free_analysis_ledger
  for select using (auth.uid() = user_id);

create or replace function public.consume_free_analysis(
  p_user_id uuid,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
begin
  if p_user_id is null or nullif(trim(p_idempotency_key), '') is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if exists (
    select 1 from public.free_analysis_ledger
    where idempotency_key = p_idempotency_key
      and user_id = p_user_id
      and source = 'usage'
  ) then
    return true;
  end if;

  select coalesce(sum(amount), 0)
    into current_balance
    from public.free_analysis_ledger
   where user_id = p_user_id;

  if current_balance < 1 then
    return false;
  end if;

  insert into public.free_analysis_ledger
    (user_id, amount, source, idempotency_key)
  values
    (p_user_id, -1, 'usage', p_idempotency_key);

  return true;
end;
$$;

revoke all on function public.consume_free_analysis(uuid, text) from public;
revoke all on function public.consume_free_analysis(uuid, text) from anon, authenticated;

comment on table public.free_analysis_ledger is
  'Server-managed free-analysis credits and usage events; clients cannot grant or consume credits directly.';
comment on function public.consume_free_analysis(uuid, text) is
  'Atomic, idempotent server-side consumption guarded by a per-user transaction lock.';
