-- Pinpoint: auth profiles + citation library. Run this once in the Supabase SQL Editor for the
-- project this app's NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY point at.
-- Users table is handled by Supabase Auth automatically (auth.users) — everything below extends it.

-- Profiles table (extends auth.users) — plan + monthly free-tier usage counter live here rather
-- than on auth.users directly, since that table isn't meant to be extended with app-specific columns.
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  plan text not null default 'free', -- 'free' | 'student' | 'institutional'
  citations_this_month integer not null default 0,
  month_reset_at timestamptz not null default date_trunc('month', now()),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up (magic link or otherwise), so the app never
-- has to handle "authenticated user, no profile row yet" as a separate case.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Citations library table
create table public.citations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source_type text not null,
  fields jsonb not null default '{}',
  footnote_text text not null,
  bibliography_text text not null,
  subsequent_text text,
  footnote_html text,
  bibliography_html text,
  label text, -- free-text "collection" (eg an assessment name) — set at save time or renamed later
  created_at timestamptz not null default now()
);

alter table public.citations enable row level security;

create policy "Users can view own citations"
  on public.citations for select
  using (auth.uid() = user_id);

create policy "Users can insert own citations"
  on public.citations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own citations"
  on public.citations for delete
  using (auth.uid() = user_id);

-- Citations are otherwise write-once/delete (the app always generates a fresh one rather than
-- mutating a saved entry's citation text) — this update policy exists only so `label` (the
-- collection a citation is filed under) can be renamed after saving. Nothing in the app UI edits
-- any other column post-insert; RLS itself doesn't restrict *which* column an update touches, just
-- who can touch their own row, the same as the existing select/delete policies.
create policy "Users can update own citations"
  on public.citations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index citations_user_id_created_at
  on public.citations(user_id, created_at desc);
