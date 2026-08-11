"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Chapter, Novel } from "@/lib/types";

interface Props {
  novel: Novel;
  chapters: Chapter[];
  initialSort?: "newest" | "oldest";
  currentChapter?: number;
}

const PAGE_SIZE = 100; // Render 100 chapters per batch

export default function ChapterList({
  novel, chapters, initialSort = "newest", currentChapter,
}: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">(initialSort);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Hydrate sort from localStorage after mount
  useEffect(() => {
    try {
      const v = localStorage.getItem(`chapters_sort_${novel.slug}`);
      if (v === "newest" || v === "oldest") setSort(v);
    } catch {}
  }, [novel.slug]);

  // Reset visible count when filter/sort changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, sort]);

  function toggleSort() {
    const next = sort === "newest" ? "oldest" : "newest";
    setSort(next);
    try { localStorage.setItem(`chapters_sort_${novel.slug}`, next); } catch {}
  }

  // Filter by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    const tokens = q.split(/\s*atau\s*|,+|\s+atau\s+|\s*或\s*/i)
      .map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) return chapters;
    return chapters.filter((ch) => {
      const num = String(ch.number);
      return tokens.some((tok) => {
        if (num.includes(tok)) return true;
        if ((ch.title ?? "").toLowerCase().includes(tok)) return true;
        return false;
      });
    });
  }, [chapters, query]);

  // Sort
  const ordered = useMemo(() => {
    return sort === "oldest"
      ? [...filtered].sort((a, b) => a.number - b.number)
      : [...filtered].sort((a, b) => b.number - a.number);
  }, [filtered, sort]);

  // Only render visible slice
  const visible = useMemo(() => ordered.slice(0, visibleCount), [ordered, visibleCount]);
  const hasMore = visibleCount < ordered.length;

  // IntersectionObserver for infinite scroll
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, ordered.length));
  }, [ordered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 opacity-60">
        <p>Belum ada chapter yang dipublikasikan.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-black/5 dark:border-white/5">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60 pointer-events-none">🔍</span>
          <input
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari Chapter, Contoh: 69 atau 76"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/60 focus:border-accent/40"
          />
        </div>
        <button
          onClick={toggleSort}
          title={sort === "newest" ? "Urut: Terbaru → Terlama" : "Urut: Terlama → Terbaru"}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-black/5 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/[0.1] transition-colors"
        >
          <span className="text-base leading-none">{sort === "newest" ? "↓" : "↑"}</span>
          <span className="hidden sm:inline">{sort === "newest" ? "Terbaru" : "Terlama"}</span>
        </button>
      </div>

      {/* Result count when filtering */}
      {query.trim() && (
        <div className="px-4 py-2 text-xs opacity-60 border-b border-black/5 dark:border-white/5">
          {filtered.length === 0 ? (
            <span>Tidak ada chapter yang cocok dengan "{query}"</span>
          ) : (
            <span>Menampilkan {filtered.length} dari {chapters.length} chapter</span>
          )}
        </div>
      )}

      {/* Chapter count indicator */}
      {!query.trim() && (
        <div className="px-4 py-2 text-xs opacity-40 border-b border-black/5 dark:border-white/5">
          {chapters.length} chapter tersedia · Menampilkan {Math.min(visibleCount, ordered.length)} chapter
        </div>
      )}

      {/* Card grid — only renders `visible` slice */}
      {ordered.length === 0 ? (
        <div className="text-center py-12 opacity-60 text-sm">
          Coba cari dengan nomor lain (contoh: "1" atau "1, 5, 10")
        </div>
      ) : (
        <>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((ch) => (
              <ChapterCard
                key={ch.id}
                novel={novel}
                chapter={ch}
                isCurrent={ch.number === currentChapter}
              />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              <div className="flex items-center gap-2 text-xs opacity-50">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Memuat {Math.min(PAGE_SIZE, ordered.length - visibleCount)} chapter lagi...
              </div>
            </div>
          )}

          {/* End of list */}
          {!hasMore && ordered.length > PAGE_SIZE && (
            <div className="text-center py-4 text-xs opacity-30">
              ✓ Semua {ordered.length} chapter ditampilkan
            </div>
          )}
        </>
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
      {isUpdated && (
        <span
          className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider pointer-events-none"
          style={{ background: "#e74c3c", color: "#fff" }}
        >
          UP
        </span>
      )}

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

      {isCurrent && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
      )}
    </Link>
  );
}

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

function isRecentlyUpdated(iso: string): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  const diffMs = Date.now() - then;
  return diffMs >= 0 && diffMs < 3 * 24 * 60 * 60 * 1000;
}
