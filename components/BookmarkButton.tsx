"use client";

import { useEffect, useState } from "react";
import type { Novel } from "@/lib/types";

const KEY = "lunovel_bookmarks";

function getBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch { return []; }
}

function setBookmarks(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {}
}

export default function BookmarkButton({ novel }: { novel: Novel }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(getBookmarks().includes(novel.id));
  }, [novel.id]);

  function toggle() {
    const current = getBookmarks();
    let next: string[];
    if (current.includes(novel.id)) {
      next = current.filter((id) => id !== novel.id);
      setBookmarked(false);
    } else {
      next = [novel.id, ...current];
      setBookmarked(true);
    }
    setBookmarks(next);
  }

  return (
    <button
      onClick={toggle}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        bookmarked
          ? "bg-accent text-white"
          : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {bookmarked ? "★ Tersimpan" : "☆ Bookmark"}
    </button>
  );
}
