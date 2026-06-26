"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Novel } from "@/lib/types";
import { getNovelBySlug, getChapter } from "@/lib/data";

interface HistoryEntry {
  novel_id: string;
  chapter_id: string;
  chapter_number: number;
  scroll_percent: number;
  read_at: string;
}

interface ReadEntry {
  novel: Novel;
  chapter: { number: number; title?: string } | null;
  scroll_percent: number;
  read_at: string;
}

const HIST_KEY = "lunovel_history";

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function ContinueReading() {
  const [reads, setReads] = useState<ReadEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const history = getHistory().slice(0, 5);
      const results: ReadEntry[] = [];

      for (const h of history) {
        try {
          const novel = await getNovelBySlug(h.novel_id);
          if (!novel) continue;
          const chapter = await getChapter(novel.id, h.chapter_number);
          results.push({
            novel,
            chapter: chapter
              ? { number: chapter.number, title: chapter.title }
              : null,
            scroll_percent: h.scroll_percent,
            read_at: h.read_at,
          });
        } catch {
          // skip failed lookups
        }
        if (results.length >= 4) break;
      }

      setReads(results);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          📖 Lanjut Baca
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-64 sm:w-72 bg-card-light dark:bg-card-dark rounded-xl border border-black/5 dark:border-white/5 p-4 animate-pulse space-y-2"
            >
              <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-black/5 dark:bg-white/5 rounded w-1/2" />
              <div className="h-2 bg-black/5 dark:bg-white/5 rounded w-full mt-3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (reads.length === 0) return null;

  const streak = calculateStreak(getHistory());

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          📖 Lanjut Baca
        </h2>
        {streak > 1 && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-orange-500">🔥</span>
            <span className="font-bold text-orange-500">{streak}</span>
            <span className="text-xs opacity-60">hari berturut-turut</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {reads.map((r) => {
          const chNum = r.chapter?.number || 1;
          return (
            <Link
              key={`${r.novel.id}-${r.chapter?.number}`}
              href={`/read/${r.novel.slug}/${chNum}`}
              className="shrink-0 w-64 sm:w-72 bg-card-light dark:bg-card-dark rounded-xl border border-black/5 dark:border-white/5 p-4 hover:shadow-md hover:border-accent/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center text-lg group-hover:bg-accent/25 transition-colors">
                  📖
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm line-clamp-1 group-hover:text-accent transition-colors">
                    {r.novel.title}
                  </div>
                  <div className="text-xs opacity-70 mt-0.5">
                    Ch {chNum}
                    {r.chapter?.title && `: ${r.chapter.title}`}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="opacity-60">Progress</span>
                  <span className="font-medium">{r.scroll_percent}%</span>
                </div>
                <div className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${r.scroll_percent}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] opacity-50 mt-2">
                {timeAgo(r.read_at)}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function calculateStreak(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;

  const dates = [
    ...new Set(history.map((h) => h.read_at.split("T")[0])),
  ]
    .map((d) => new Date(d + "T00:00:00"))
    .sort((a, b) => b.getTime() - a.getTime());

  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays > 1) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = Math.round(
      (dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID");
}
