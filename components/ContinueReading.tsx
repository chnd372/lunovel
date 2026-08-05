"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HistoryEntry = {
  novel_id: string;
  novel_slug: string;
  novel_title?: string;
  chapter_id: string;
  chapter_number: number;
  chapter_title?: string;
  scroll_percent: number;
  read_at: string;
};

const HISTORY_KEY = "lunovel_history";

export default function ContinueReading() {
  const [entry, setEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    try {
      const data: HistoryEntry[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (data[0]?.novel_slug) setEntry(data[0]);
    } catch {}
  }, []);

  if (!entry) return null;
  const progress = Math.min(100, Math.max(0, Math.round(entry.scroll_percent || 0)));

  return (
    <section className="mt-6 rounded-2xl overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg">
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-widest uppercase text-white/75">Lanjut Baca</p>
          <h2 className="mt-1 text-xl font-bold truncate">{entry.novel_title || "Novel terakhir"}</h2>
          <p className="mt-1 text-sm text-white/85 truncate">Bab {entry.chapter_number}{entry.chapter_title ? `: ${entry.chapter_title}` : ""}</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium">
            <div className="h-1.5 w-32 rounded-full bg-white/25 overflow-hidden"><div className="h-full bg-white" style={{ width: `${progress}%` }} /></div>
            <span>{progress}% selesai</span>
          </div>
        </div>
        <Link href={`/read/${entry.novel_slug}/${entry.chapter_number}`} className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-orange-700 shadow hover:bg-orange-50">
          Lanjutkan →
        </Link>
      </div>
    </section>
  );
}
