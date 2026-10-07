-- AstroGuide: универсальное хранилище пользовательских результатов.
--
-- source_data содержит только минимальные входные данные, необходимые для
-- восстановления или отображения результата. result_data содержит уже
-- рассчитанный результат. Секреты, токены, service-role keys и платёжные
-- секреты никогда не должны записываться в эти JSONB-поля.

create table if not exists public.user_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  result_type text not null check (result_type in ('tarot', 'compatibility', 'forecast', 'report')),
  title text not null check (char_length(trim(title)) between 1 and 200),
  created_at timestamptz not null default now(),
  access_type text not null default 'free' check (access_type in ('free', 'premium', 'purchase', 'subscription')),
  source_data jsonb not null default '{}'::jsonb,
  result_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists user_results_user_id_idx
  on public.user_results(user_id);

create index if not exists user_results_user_type_created_idx
  on public.user_results(user_id, result_type, created_at desc);

alter table public.user_results enable row level security;

drop policy if exists "user_results_select_own" on public.user_results;
create policy "user_results_select_own" on public.user_results
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_results_insert_own" on public.user_results;
create policy "user_results_insert_own" on public.user_results
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_results_update_own" on public.user_results;
create policy "user_results_update_own" on public.user_results
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_results_delete_own" on public.user_results;
create policy "user_results_delete_own" on public.user_results
  for delete
  using (auth.uid() = user_id);
