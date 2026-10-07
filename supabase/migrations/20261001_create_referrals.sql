-- Referral foundation. Referral rows are server-managed; client code must not
-- be trusted to choose referrers, statuses, or rewards.
-- Never store passwords, tokens, API keys, service-role keys, or payment secrets.

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null check (code ~ '^[A-Za-z0-9_-]{6,32}$'),
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  constraint referral_codes_user_unique unique (user_id),
  constraint referral_codes_code_unique unique (code)
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  referral_code text not null references public.referral_codes(code),
  status text not null default 'pending' check (status in ('pending', 'qualified', 'rewarded')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  constraint referrals_referred_unique unique (referred_user_id),
  constraint referrals_no_self_referral check (referrer_user_id <> referred_user_id)
);

create index if not exists referral_codes_user_idx on public.referral_codes(user_id);
create index if not exists referrals_referrer_status_idx on public.referrals(referrer_user_id, status, created_at desc);
create index if not exists referrals_code_idx on public.referrals(referral_code);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

drop policy if exists referral_codes_select_own on public.referral_codes;
create policy referral_codes_select_own
  on public.referral_codes for select
  using (auth.uid() = user_id);

drop policy if exists referrals_select_involved on public.referrals;
create policy referrals_select_involved
  on public.referrals for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

comment on table public.referral_codes is 'Server-managed public referral codes; code must not encode user identity or secrets.';
comment on table public.referrals is 'Server-managed referral attribution and qualification state. Client cannot insert or update rows.';
comment on column public.referrals.status is 'Only trusted backend processes may move pending to qualified/rewarded.';
