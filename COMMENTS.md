# Comment System

Threaded comments shown at the bottom of every chapter read page.

## Backend priority (auto-detected at runtime)

1. **Supabase** — if `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
2. **Vercel KV / Upstash Redis** — if `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set
3. **Disabled** — comments UI still renders, but submit fails with a friendly error

The active backend is logged once per process in the server console.

## Setup — Vercel KV (fastest, recommended)

1. Vercel dashboard → your `lunovel` project → **Storage** tab → **Create Database** → **KV**
2. Pick a region close to your readers, give it a name (e.g. `lunovel-kv`)
3. Click **Connect to Project** → `lunovel`
4. Vercel auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into your Production / Preview / Dev environments
5. Redeploy — comments will start working immediately

Free tier: 30,000 commands/day, 256 MB storage — plenty for a reader site.

## Setup — Supabase (more features, real-time ready)

1. Supabase dashboard → **SQL Editor** → New query → paste contents of [`supabase/migrations/001_comments.sql`](./supabase/migrations/001_comments.sql) → Run
2. Vercel dashboard → `lunovel` → **Settings** → **Environment Variables** → add
   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your `anon` / `public` API key
3. Redeploy

Comments get row-level security (public read approved, anon insert) and an index on `(chapter_id, created_at)` so per-chapter fetches stay O(log n).

## Features

- ✅ Threaded replies (capped visual indent at depth 3 — same UX as WordPress)
- ✅ WordPress-inspired dark UI that matches the reader's light/sepia/dark themes
- ✅ Anonymous-friendly: only `author_name` is required; email + URL are optional
- ✅ Markdown-lite in comments: `**bold**`, `*italic*`, `` `code` ``, auto-link URLs
- ✅ LocalStorage "remember me" (the "Simpan nama…" checkbox)
- ✅ Honeypot anti-bot + rate limit (3 comments / IP / 5 min, 429 with `Retry-After`)
- ✅ Input validation (length caps, email regex, link count)
- ✅ Optimistic UI: form clears + list refreshes after successful post
- ✅ Deterministic avatar color from name (no external image fetches)
- ✅ No third-party iframe, no external trackers, no login required

## API

### `GET /api/comments?chapter_id={id}`
```json
{
  "backend": "kv",
  "comments": [...],
  "tree": [...],
  "count": 12
}
```

### `POST /api/comments`
```json
{
  "chapter_id": "uuid-or-text",
  "novel_id": "uuid-or-text",
  "parent_id": null,
  "author_name": "Budi",
  "author_email": "budi@example.com",
  "author_url": "https://example.com",
  "content": "**Mantap!** Lanjut chapter berikutnya.",
  "website": ""   // honeypot — leave empty
}
```
Returns `{ ok: true, comment }` on success, `{ error }` with appropriate 4xx/5xx on failure.

## Storage layout

### Vercel KV
- Key: `chapter:{chapter_id}:comments`
- Value: JSON array of `Comment` objects (capped at last 1000 per chapter)

### Supabase
- Table: `comments` (see migration SQL for full schema)
- View: `comment_counts` (per-chapter totals)

## Caveats

- Vercel KV has no real-time push; the client refetches after each successful post. If you want live updates for other users, wire `supabase.channel().on('postgres_changes', ...)` in `lib/comments.ts` and subscribe in `Comments.tsx`.
- The rate-limit bucket lives in the serverless function's memory, so each cold start resets it. For spam-grade protection wire the rate limit into Redis (`kv.incr`) or use Supabase Edge Functions.
- No edit/delete UI yet. The data model supports it — just add `updated_at` + a `user_token` (returned on POST) and a `PATCH /api/comments/[id]` route.