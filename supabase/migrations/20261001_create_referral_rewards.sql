-- Server-managed referral reward ledger. Do not apply automatically.

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  reward_type text not null check (reward_type in ('tarot_free', 'tarot_extended', 'premium_days', 'subscription_bonus')),
  product_id text check (product_id in ('tarot_extended', 'premium_subscription', 'natal_full_report', 'compatibility_extended', 'forecast_extended')),
  amount integer not null default 1 check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'granted', 'used', 'expired', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists referral_rewards_condition_unique
  on public.referral_rewards(referral_id, reward_type)
  where referral_id is not null;
create index if not exists referral_rewards_user_status_idx
  on public.referral_rewards(user_id, status, created_at desc);

alter table public.referral_rewards enable row level security;
drop policy if exists referral_rewards_select_own on public.referral_rewards;
create policy referral_rewards_select_own on public.referral_rewards for select using (auth.uid() = user_id);

comment on table public.referral_rewards is 'Server-managed reward ledger. Clients cannot grant, consume, extend, or revoke rewards.';
