"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Novel } from "@/lib/types";
import { getAllNovels, getChaptersByNovel } from "@/lib/data";

interface HistoryEntry {
  novel_id: string;
  chapter_id: string;
  chapter_number: number;
  scroll_percent: number;
  read_at: string;
}

const HIST_KEY = "lunovel_history";
const BM_KEY = "lunovel_bookmarks";

export default function ProfilePage() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    setBookmarks(JSON.parse(localStorage.getItem(BM_KEY) || "[]"));
    setHistory(JSON.parse(localStorage.getItem(HIST_KEY) || "[]"));

    // Load novel data for bookmark/history
    (async () => {
      const all = await getAllNovels();
      setNovels(all);
      const titles: Record<string, string> = {};
      for (const h of JSON.parse(localStorage.getItem(HIST_KEY) || "[]")) {
        try {
          const chs = await getChaptersByNovel(h.novel_id);
          const ch = chs.find((c) => c.id === h.chapter_id);
          if (ch) titles[h.chapter_id] = ch.title || `Chapter ${ch.number}`;
        } catch {}
      }
      setChapterTitles(titles);
    })();
  }, []);

  const bookmarkNovels = novels.filter((n) => bookmarks.includes(n.id));
  const historyEntries = history
    .map((h) => {
      const novel = novels.find((n) => n.id === h.novel_id);
      return novel ? { ...h, novel } : null;
    })
    .filter(Boolean) as (HistoryEntry & { novel: Novel })[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold font-serif">Profil Lo</h1>

      {/* History */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          📖 Riwayat Bacaan
          <span className="text-xs opacity-60 font-normal">({historyEntries.length})</span>
        </h2>
        {historyEntries.length === 0 ? (
          <p className="text-sm opacity-60 py-6 text-center bg-black/5 dark:bg-white/5 rounded-xl">
            Belum ada riwayat. Mulai baca novel pertama lo yuk!
          </p>
        ) : (
          <div className="space-y-2">
            {historyEntries.map((h) => (
              <Link
                key={h.chapter_id}
                href={`/read/${h.novel.slug}/${h.chapter_number}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:bg-accent/5"
              >
                <div className="shrink-0 w-12 h-12 rounded bg-accent/10 flex items-center justify-center text-lg">
                  📖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-1">{h.novel.title}</div>
                  <div className="text-xs opacity-70">
                    Ch {h.chapter_number}: {chapterTitles[h.chapter_id] || "—"}
                  </div>
                  <div className="mt-1 h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${h.scroll_percent}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs opacity-60 shrink-0">
                  {h.scroll_percent}%
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bookmarks */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          ⭐ Bookmark
          <span className="text-xs opacity-60 font-normal">({bookmarkNovels.length})</span>
        </h2>
        {bookmarkNovels.length === 0 ? (
          <p className="text-sm opacity-60 py-6 text-center bg-black/5 dark:bg-white/5 rounded-xl">
            Belum ada bookmark. Klik tombol ☆ di halaman novel.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bookmarkNovels.map((n) => (
              <Link
                key={n.id}
                href={`/novel/${n.slug}`}
                className="flex items-center gap-2 p-3 rounded-lg bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:bg-accent/5"
              >
                <div className="shrink-0 w-10 h-10 rounded bg-accent/20 flex items-center justify-center">
                  {n.cover ? "🖼" : "📖"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm line-clamp-2">{n.title}</div>
                  {n.author && <div className="text-xs opacity-60 line-clamp-1">{n.author}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs opacity-60 text-center pt-4 border-t border-black/5 dark:border-white/5">
        Data lo disimpan secara lokal di browser ini.
        <br />
        <Link href="/login" className="text-accent hover:underline">
          Setup akun cloud
        </Link>{" "}
        untuk sinkronisasi antar device.
      </div>
    </div>
  );
}
