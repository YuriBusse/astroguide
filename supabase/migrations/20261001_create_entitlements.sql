-- Server-managed access grants. Do not apply automatically.
-- No secrets, tokens, payment credentials, or Telegram data belong here.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null check (product_id in ('natal_full_report', 'tarot_extended', 'compatibility_extended', 'forecast_extended', 'premium_subscription')),
  access_type text not null check (access_type in ('purchase', 'subscription', 'reward')),
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  source text not null check (source in ('purchase', 'subscription', 'referral_reward', 'admin')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint entitlements_dates_valid check (expires_at is null or expires_at > starts_at)
);

create unique index if not exists entitlements_active_unique
  on public.entitlements(user_id, product_id, access_type)
  where status = 'active' and expires_at is null;
create index if not exists entitlements_user_product_idx
  on public.entitlements(user_id, product_id, status);

alter table public.entitlements enable row level security;
drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own on public.entitlements for select using (auth.uid() = user_id);

comment on table public.entitlements is 'Trusted server-managed access grants. Clients can read only their own rows.';
