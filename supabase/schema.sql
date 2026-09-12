-- Wattouna community schema — copy-paste into Supabase SQL Editor
-- (or save as a migration). Requires pgcrypto for gen_random_uuid().

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text default '',
  country_code text not null default 'TN',
  upcycled_energy_wh numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled circuit',
  description text not null default '',
  slug text unique,
  canvas_state jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  forked_from uuid references public.projects (id) on delete set null,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_author_idx on public.projects (author_id);
create index if not exists projects_public_idx on public.projects (is_public, created_at desc);
create index if not exists projects_fork_idx on public.projects (forked_from);

-- --------------------------------------- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'user_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------- updated_at upkeep
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch
  before update on public.projects
  for each row execute procedure public.touch_updated_at();

-- ------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- profiles: public read, owners write
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read"
  on public.profiles for select using (true);

drop policy if exists "profiles owner insert" on public.profiles;
create policy "profiles owner insert"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update"
  on public.profiles for update using (auth.uid() = id);

-- projects: public read of published, authors write own rows
drop policy if exists "projects public read" on public.projects;
create policy "projects public read"
  on public.projects for select
  using (is_public = true or auth.uid() = author_id);

drop policy if exists "projects author insert" on public.projects;
create policy "projects author insert"
  on public.projects for insert with check (auth.uid() = author_id);

drop policy if exists "projects author update" on public.projects;
create policy "projects author update"
  on public.projects for update using (auth.uid() = author_id);

drop policy if exists "projects author delete" on public.projects;
create policy "projects author delete"
  on public.projects for delete using (auth.uid() = author_id);
