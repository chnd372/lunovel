-- KomikKu Supabase schema
-- Run this in Supabase SQL Editor after creating a new project.
-- Then set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env

-- ============================================================
-- Tables
-- ============================================================

create table if not exists series (
  id text primary key,
  slug text unique not null,
  title text not null,
  alt_titles text[] default '{}',
  author text,
  artist text,
  status text check (status in ('ongoing', 'completed', 'hiatus')) default 'ongoing',
  type text check (type in ('manga', 'manhwa', 'manhua')) default 'manga',
  genres text[] default '{}',
  description text default '',
  cover text,
  release_year int,
  rating numeric(2,1) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists series_slug_idx on series (slug);
create index if not exists series_updated_idx on series (updated_at desc);
create index if not exists series_genres_idx on series using gin (genres);

create table if not exists chapters (
  id text primary key,
  series_id text references series(id) on delete cascade,
  number numeric not null,
  title text,
  pages text[] not null,
  published_at timestamptz default now(),
  unique (series_id, number)
);

create index if not exists chapters_series_idx on chapters (series_id, number desc);

-- ============================================================
-- User-scoped tables (require Supabase Auth)
-- ============================================================

create table if not exists bookmarks (
  user_id uuid references auth.users(id) on delete cascade,
  series_id text references series(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, series_id)
);

create table if not exists history (
  user_id uuid references auth.users(id) on delete cascade,
  series_id text references series(id) on delete cascade,
  chapter_id text references chapters(id) on delete cascade,
  chapter_number numeric not null,
  page int default 0,
  read_at timestamptz default now(),
  primary key (user_id, series_id)
);

create index if not exists history_user_idx on history (user_id, read_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table series enable row level security;
alter table chapters enable row level security;
alter table bookmarks enable row level security;
alter table history enable row level security;

-- Public read access
create policy "public read series" on series for select using (true);
create policy "public read chapters" on chapters for select using (true);

-- Users manage their own bookmarks/history
create policy "user bookmarks" on bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user history" on history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket for cover + chapter images
-- ============================================================

-- Run these in the Supabase Dashboard → Storage, or via SQL:
-- insert into storage.buckets (id, name) values ('covers', 'covers') on conflict do nothing;
-- insert into storage.buckets (id, name) values ('chapters', 'chapters') on conflict do nothing;
--
-- Then in Storage policies, allow public read on both buckets.

-- ============================================================
-- Sample data (optional — you can skip and use local JSON instead)
-- ============================================================
-- The app works with local JSON files in /data when Supabase env vars are empty.
-- Set NEXT_PUBLIC_SUPABASE_URL/KEY and the app will switch to Supabase.
