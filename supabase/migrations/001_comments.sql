// Supabase migration for the comments table.
// Run this in the Supabase SQL Editor (Project → SQL → New query) before
// enabling NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  chapter_id text not null,
  novel_id text not null,
  parent_id uuid references comments(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 60),
  author_email text,
  author_url text,
  content text not null check (char_length(content) between 1 and 5000),
  ip_hash text,
  user_agent text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists comments_chapter_idx
  on comments (chapter_id, created_at asc);

create index if not exists comments_parent_idx
  on comments (parent_id);

create index if not exists comments_novel_idx
  on comments (novel_id);

alter table comments enable row level security;

-- Public can read approved comments
drop policy if exists "public read approved comments" on comments;
create policy "public read approved comments"
  on comments for select
  using (is_approved = true);

-- Anyone (incl. anon) can insert; rate limit enforced in API route.
drop policy if exists "anon insert comments" on comments;
create policy "anon insert comments"
  on comments for insert
  with check (true);

-- Optional: author can edit their own comment (skipped here since we don't
-- have user accounts wired to comments yet).

-- Helpful view: comment counts per chapter
create or replace view comment_counts as
  select chapter_id, count(*) as total
  from comments
  where is_approved = true
  group by chapter_id;