"use client";

import { useEffect, useState } from "react";
import type { Novel } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const KEY = "lunovel_bookmarks";

function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

function setBookmarksLocal(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {}
}

export default function BookmarkButton({ novel }: { novel: Novel }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setBookmarked(getBookmarks().includes(novel.id));
  }, [novel.id]);

  async function toggle() {
    const current = getBookmarks();
    const isAdding = !current.includes(novel.id);
    let next: string[];

    if (isAdding) {
      next = [novel.id, ...current];
      setBookmarked(true);
    } else {
      next = current.filter((id) => id !== novel.id);
      setBookmarked(false);
    }
    setBookmarksLocal(next);

    // Sync to Supabase in background (if logged in)
    const client = supabase;
    if (client) {
      setSyncing(true);
      try {
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          if (isAdding) {
            await client.from("bookmarks").upsert({
              user_id: user.id,
              series_id: novel.id,
            });
          } else {
            await client.from("bookmarks").delete()
              .eq("user_id", user.id)
              .eq("series_id", novel.id);
          }
        }
      } catch (err) {
        console.warn("Bookmark sync failed:", err);
      } finally {
        setSyncing(false);
      }
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={syncing}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        bookmarked
          ? "bg-accent text-white"
          : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
      } ${syncing ? "opacity-60" : ""}`}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {syncing ? "⏳ Syncing..." : bookmarked ? "★ Tersimpan" : "☆ Bookmark"}
    </button>
  );
}
