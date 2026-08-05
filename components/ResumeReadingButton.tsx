"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entry = { novel_id: string; novel_slug: string; chapter_number: number; scroll_percent: number };

export default function ResumeReadingButton({ novelId, slug }: { novelId: string; slug: string }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  useEffect(() => {
    try {
      const list: Entry[] = JSON.parse(localStorage.getItem("lunovel_history") || "[]");
      setEntry(list.find((item) => item.novel_id === novelId) || null);
    } catch {}
  }, [novelId]);
  if (!entry) return null;
  return <Link href={`/read/${slug}/${entry.chapter_number}`} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600">▶ Lanjutkan Ch {entry.chapter_number} ({Math.round(entry.scroll_percent || 0)}%)</Link>;
}
