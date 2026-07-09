"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { Chapter, Novel } from "@/lib/types";

interface Props {
  novel: Novel;
  chapters: Chapter[];
  /** initial sort order coming from server (search param) */
  initialSort?: "newest" | "oldest";
  currentChapter?: number;
}

/**
 * Chapter list with search bar + sort toggle + responsive card grid.
 *
 * Search supports comma- or "atau"-separated chapter numbers:
 *   "69 atau 76"  → matches ch 69 & 76
 *   "69, 76, 100" → matches ch 69, 76 & 100
 *   "69"          → matches ch 69 only
 * Empty input → show all chapters (no filter).
 *
 * Sort persists per-novel in localStorage as `chapters_sort_${slug}`.
 * Server still passes an initial order via `initialSort` for SSR.
 */
export default function ChapterList({
  novel, chapters, initialSort = "newest", currentChapter,
}: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">(initialSort);

  // Hydrate sort from localStorage after mount (server already passed initial)
  useEffect(() => {
    try {
      const v = localStorage.getItem(`chapters_sort_${novel.slug}`);
      if (v === "newest" || v === "oldest") setSort(v);
    } catch {}
  }, [novel.slug]);

  function toggleSort() {
    const next = sort === "newest" ? "oldest" : "newest";
    setSort(next);
    try { localStorage.setItem(`chapters_sort_${novel.slug}`, next); } catch {}
  }

  // Filter by query (supports "69 atau 76" / "69, 76" / "69")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    // Split on "atau" or comma (also handle Chinese "或" just in case)
    const tokens = q.split(/\s*atau\s*|,+|\s+atau\s+|\s*或\s*/i)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return chapters;
    return chapters.filter((ch) => {
      const num = String(ch.number);
      return tokens.some((tok) => {
        // Numeric match: ch.number string contains token
        if (num.includes(tok)) return true;
        // Title match fallback
        if ((ch.title ?? "").toLowerCase().includes(tok)) return true;
        return false;
      });
    });
  }, [chapters, query]);

  // Display order — respect current sort
  const ordered = useMemo(() => {
    return sort === "oldest"
      ? [...filtered].sort((a, b) => a.number - b.number)
      : [...filtered].sort((a, b) => b.number - a.number);
  }, [filtered, sort]);

  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 opacity-60">
        <p>Belum ada chapter yang dipublikasikan.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar: search + sort */}
      <div className="flex items-center gap-2 p-3 border-b border-black/5 dark:border-white/5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60 pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Chapter, Contoh: 69 atau 76"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40"
          />
        </div>

        {/* Sort toggle */}
        <button
          onClick={toggleSort}
          title={sort === "newest" ? "Urut: Terbaru → Terlama (klik untuk ubah)" : "Urut: Terlama → Terbaru (klik untuk ubah)"}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/[0.1] transition-colors"
        >
          <span className="text-base leading-none">
            {sort === "newest" ? "↓" : "↑"}
          </span>
          <span className="hidden sm:inline">
            {sort === "newest" ? "Terbaru" : "Terlama"}
          </span>
        </button>
      </div>

      {/* Result count (only when filtering) */}
      {query.trim() && (
        <div className="px-4 py-2 text-xs opacity-60 border-b border-black/5 dark:border-white/5">
          {filtered.length === 0 ? (
            <span>Tidak ada chapter yang cocok dengan "{query}"</span>
          ) : (
            <span>
              Menampilkan {filtered.length} dari {chapters.length} chapter
            </span>
          )}
        </div>
      )}

      {/* Card grid */}
      {ordered.length === 0 ? (
        <div className="text-center py-12 opacity-60 text-sm">
          Coba cari dengan nomor lain (contoh: "1" atau "1, 5, 10")
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ordered.map((ch) => (
            <ChapterCard
              key={ch.id}
              novel={novel}
              chapter={ch}
              isCurrent={ch.number === currentChapter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterCard({
  novel, chapter, isCurrent,
}: {
  novel: Novel;
  chapter: Chapter;
  isCurrent?: boolean;
}) {
  const cover = novel.cover;
  const isUpdated = isRecentlyUpdated(chapter.published_at);

  return (
    <Link
      href={`/read/${novel.slug}/${chapter.number}`}
      className={`group relative flex gap-3 p-3 rounded-xl border transition-all duration-150 overflow-hidden
        bg-[#2a2a3e] hover:bg-[#34344a] border-white/5 hover:border-white/15
        text-white hover:shadow-lg hover:shadow-black/20
        ${isCurrent ? "ring-2 ring-accent border-accent/40" : ""}
      `}
    >
      {/* UP badge */}
      {isUpdated && (
        <span
          className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider pointer-events-none"
          style={{ background: "#e74c3c", color: "#fff" }}
        >
          UP
        </span>
      )}

      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-neutral-700/80 flex items-center justify-center">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <span className="text-2xl opacity-50">📖</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-sm font-semibold line-clamp-1 pr-10">
          Chapter {chapter.number}
        </div>
        {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
          <div className="text-xs opacity-70 line-clamp-1 mt-0.5">
            {chapter.title}
          </div>
        )}
        <div className="text-[11px] opacity-60 mt-1">
          {timeAgoID(chapter.published_at)}
        </div>
      </div>

      {/* Current indicator stripe */}
      {isCurrent && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
      )}
    </Link>
  );
}

/** Indonesian relative time matching spec wording. */
function timeAgoID(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d === 1 ? "1 hari lalu" : `${d} hari lalu`}`;
  if (d < 30) return `${d} hari lalu`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo === 1 ? "1 bulan lalu" : `${mo} bulan lalu`}`;
  return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

/** UP badge rule: chapter updated within last 3 days. */
function isRecentlyUpdated(iso: string): boolean {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  return diffMs >= 0 && diffMs < 3 * 24 * 60 * 60 * 1000;
}