# KomikKu

Website baca komik gratis. Stack: Next.js 14 + TypeScript + Tailwind + Supabase (optional).

## Quick Start

```bash
# 1. Install deps
npm install

# 2. Run dev server
npm run dev
# → http://localhost:3000

# 3. Build for production
npm run build
```

Berfungsi **zero-config** dengan sample data lokal. Untuk content asli, edit:
- `data/series.json` — list komik
- `data/chapters/<id>.json` — chapter per series (pages = array URL gambar)

## Setup dengan Supabase (recommended)

1. Buat project di https://supabase.com (free tier)
2. Buka SQL Editor → run `supabase/schema.sql`
3. Set di `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```
4. Restart `npm run dev`. App otomatis switch dari JSON lokal ke Supabase.

## Deploy ke Vercel

```bash
# Login (sekali)
npx vercel login

# Set token
export VERCEL_TOKEN=vcp_xxxx
export VERCEL_TEAM_ID=team_xxx

# Deploy
npx vercel --prod --regions sin1
```

Atau via Vercel Dashboard:
1. Push repo ke GitHub
2. https://vercel.com/new → import
3. Set region **Singapore (sin1)**
4. Add env vars (jika pakai Supabase)
5. Deploy

## Struktur

```
app/
  page.tsx                    # Beranda
  series/[slug]/page.tsx      # Detail series
  read/[slug]/[chapter]/page.tsx  # Reader
  search/page.tsx             # Search + filter
  login/page.tsx              # Auth
  profile/page.tsx            # Bookmarks + history
components/
  Navbar.tsx
  SeriesCard.tsx
  ChapterList.tsx
  Reader.tsx                  # Webtoon + single-page mode
  BookmarkButton.tsx
lib/
  supabase.ts
  data.ts                     # Auto-fallback JSON ↔ Supabase
  types.ts
data/
  series.json
  chapters/<id>.json
supabase/
  schema.sql                  # DB schema + RLS
```

## Features

- ✅ Beranda + featured
- ✅ Series detail dengan daftar chapter
- ✅ Reader mode webtoon (scroll vertikal) + single page
- ✅ Search & filter (genre, status, type)
- ✅ Bookmark + history (localStorage, sync ke Supabase kalau login)
- ✅ Dark mode (auto-detect + manual)
- ✅ Mobile responsive
- ✅ Keyboard navigation (arrow keys di single mode)
- ✅ Lazy load images
- ✅ SEO meta per page

## Menambah komik baru

### Cara 1: Edit JSON (simple, no DB)
1. Tambah entry di `data/series.json`:
   ```json
   {
     "id": "komik-baru",
     "slug": "judul-komik",
     "title": "Judul Komik",
     ...
   }
   ```
2. Upload gambar ke image host (ImgBB, GitHub, dsb)
3. Buat `data/chapters/komik-baru.json`:
   ```json
   [{ "id": "ch1", "series_id": "komik-baru", "number": 1, "pages": ["https://.../page1.jpg", "https://.../page2.jpg"] }]
   ```

### Cara 2: Via Supabase Dashboard
Insert row ke table `series` dan `chapters` di Supabase Studio.

## Free Tier Limits

- **Vercel**: 100GB bandwidth/mo, unlimited static
- **Supabase**: 500MB DB, 1GB storage, 50k MAU
- **Picsum.photos** (sample images): unlimited
- Total cost: **$0** untuk traffic normal

## License

MIT. Komik content tetap hak cipta masing-masing creator.
