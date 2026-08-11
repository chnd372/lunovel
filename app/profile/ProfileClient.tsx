"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Novel } from "@/lib/types";
import { getAllNovels, getChaptersByNovel } from "@/lib/data";
import { supabase } from "@/lib/supabase";

interface HistoryEntry {
  novel_id: string;
  chapter_id: string;
  chapter_number: number;
  scroll_percent: number;
  read_at: string;
}

const HIST_KEY = "lunovel_history";
const BM_KEY = "lunovel_bookmarks";

export default function ProfileClient() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapterTitles, setChapterTitles] = useState<Record<string, string>>({});
  const [user, setUser] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // 1. Get local data
    const localBms = JSON.parse(localStorage.getItem(BM_KEY) || "[]");
    const localHist = JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
    setBookmarks(localBms);
    setHistory(localHist);

    // 2. Fetch Supabase user and sync
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          syncSupabaseData(user, localBms, localHist);
        }
      });
    }

    // 3. Load novel & chapter titles
    (async () => {
      const all = await getAllNovels();
      setNovels(all);
      const titles: Record<string, string> = {};
      const targetHist = user ? history : localHist;
      for (const h of targetHist) {
        try {
          const chs = await getChaptersByNovel(h.novel_id);
          const ch = chs.find((c) => c.id === h.chapter_id);
          if (ch) titles[h.chapter_id] = ch.title || `Chapter ${ch.number}`;
        } catch {}
      }
      setChapterTitles(titles);
    })();
  }, [user]);

  async function syncSupabaseData(currUser: any, localBms: string[], localHist: HistoryEntry[]) {
    if (!supabase) return;
    setSyncing(true);
    try {
      // --- Bookmarks Sync ---
      const { data: dbBms } = await supabase
        .from("bookmarks")
        .select("series_id")
        .eq("user_id", currUser.id);
      
      const dbBmIds = (dbBms || []).map((b) => b.series_id);
      const mergedBms = Array.from(new Set([...localBms, ...dbBmIds]));
      
      // Update local storage
      localStorage.setItem(BM_KEY, JSON.stringify(mergedBms));
      setBookmarks(mergedBms);

      // Write local-only bookmarks to DB
      const localOnlyBms = localBms.filter((id) => !dbBmIds.includes(id));
      if (localOnlyBms.length > 0) {
        await supabase.from("bookmarks").insert(
          localOnlyBms.map((id) => ({ user_id: currUser.id, series_id: id }))
        );
      }

      // --- History Sync ---
      const { data: dbHist } = await supabase
        .from("history")
        .select("series_id, chapter_id, chapter_number, page, read_at")
        .eq("user_id", currUser.id);

      const dbEntries: HistoryEntry[] = (dbHist || []).map((h) => ({
        novel_id: h.series_id,
        chapter_id: h.chapter_id,
        chapter_number: Number(h.chapter_number),
        scroll_percent: h.page || 0, // 'page' stores scroll percent
        read_at: h.read_at,
      }));

      // Merge history entries by novel_id (newest wins)
      const histMap = new Map<string, HistoryEntry>();
      [...localHist, ...dbEntries].forEach((h) => {
        const existing = histMap.get(h.novel_id);
        if (!existing || new Date(h.read_at) > new Date(existing.read_at)) {
          histMap.set(h.novel_id, h);
        }
      });
      const mergedHist = Array.from(histMap.values());
      
      localStorage.setItem(HIST_KEY, JSON.stringify(mergedHist));
      setHistory(mergedHist);

      // Upload newer local progress to Supabase
      for (const lh of localHist) {
        const matchingDb = dbEntries.find((dh) => dh.novel_id === lh.novel_id);
        if (!matchingDb || new Date(lh.read_at) > new Date(matchingDb.read_at)) {
          await supabase.from("history").upsert({
            user_id: currUser.id,
            series_id: lh.novel_id,
            chapter_id: lh.chapter_id,
            chapter_number: lh.chapter_number,
            page: lh.scroll_percent,
            read_at: lh.read_at,
          });
        }
      }
    } catch (e) {
      console.error("Supabase sync error:", e);
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  }

  const bookmarkNovels = novels.filter((n) => bookmarks.includes(n.id));
  const historyEntries = history
    .map((h) => {
      const novel = novels.find((n) => n.id === h.novel_id);
      return novel ? { ...h, novel } : null;
    })
    .filter(Boolean) as (HistoryEntry & { novel: Novel })[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* User Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5 dark:border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif">Profil Lo</h1>
          {user && (
            <p className="text-xs opacity-60 mt-1">
              Masuk sebagai <span className="font-semibold text-accent">{user.email}</span>
              {syncing && " (⏳ Menyinkronkan...)"}
            </p>
          )}
        </div>
        {user ? (
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-white border border-red-500/35 hover:bg-red-500/90 rounded-lg transition-colors"
          >
            Logout
          </button>
        ) : (
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-semibold text-accent hover:text-white border border-accent/35 hover:bg-accent rounded-lg transition-colors"
          >
            Login Cloud
          </Link>
        )}
      </div>

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
        {user ? "Data lo disinkronkan dengan aman di cloud." : "Data lo disimpan secara lokal di browser ini."}
      </div>
    </div>
  );
}
