-- AstroGuide V12: базовая схема
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_date date not null,
  birth_time time not null,
  city text not null,
  timezone text,
  latitude numeric,
  longitude numeric,
  premium boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_rub integer not null default 499,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  provider text not null default 'yookassa',
  provider_payment_id text,
  chart_id uuid references public.charts(id) on delete set null,
  chart_date date,
  chart_time time,
  chart_city text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists charts_user_id_idx on public.charts(user_id);
create index if not exists orders_user_id_idx on public.orders(user_id);

alter table public.profiles enable row level security;
alter table public.charts enable row level security;
alter table public.orders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "charts_select_own" on public.charts;
create policy "charts_select_own" on public.charts
for select using (auth.uid() = user_id);

drop policy if exists "charts_insert_own" on public.charts;
create policy "charts_insert_own" on public.charts
for insert with check (auth.uid() = user_id);

drop policy if exists "charts_delete_own" on public.charts;
create policy "charts_delete_own" on public.charts
for delete using (auth.uid() = user_id);

-- Заказы пользователю можно читать, но менять их должен только сервер.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
for select using (auth.uid() = user_id);

-- ВАЖНО: поле premium не должно быть способом оплаты.
-- После подключения webhook сервер будет менять доступ Premium
-- через защищённую server-side логику.
