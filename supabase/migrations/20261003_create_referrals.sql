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
  status text not null default 'pending' check (status in ('pending', 'qualified', 'rewarded', 'rejected')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  rewarded_at timestamptz,
  constraint referrals_no_self check (referrer_user_id <> referred_user_id),
  constraint referrals_referred_unique unique (referred_user_id)
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_user_id, created_at desc);
create index if not exists referrals_code_idx on public.referrals(referral_code);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid not null references public.referrals(id) on delete cascade,
  reward_type text not null check (reward_type in ('free_analysis')),
  status text not null default 'available' check (status in ('available', 'used', 'revoked')),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint referral_rewards_once unique (referral_id, reward_type)
);

create index if not exists referral_rewards_user_idx on public.referral_rewards(user_id, status);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;

create policy "referral_codes_own_select" on public.referral_codes
for select using (auth.uid() = user_id);

create policy "referrals_own_select" on public.referrals
for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

create policy "referral_rewards_own_select" on public.referral_rewards
for select using (auth.uid() = user_id);
