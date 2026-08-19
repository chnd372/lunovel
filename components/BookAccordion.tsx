"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Chapter, Novel } from "@/lib/types";

interface Props {
  novel: Novel;
  chapters: Chapter[];
}

export default function BookAccordion({ novel, chapters }: Props) {
  const router = useRouter();
  const books = novel.books ?? [];
  const [openBook, setOpenBook] = useState<string | null>(null);

  const bookChapters = useMemo(() => {
    const map: Record<string, Chapter[]> = {};
    for (const book of books) {
      map[book.name] = chapters
        .filter((c) => c.number >= book.chapter_start && c.number <= book.chapter_end)
        .sort((a, b) => a.number - b.number);
    }
    return map;
  }, [books, chapters]);

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold opacity-80 uppercase tracking-wider">Chapters</h2>

      {books.map((book) => {
        const isOpen = openBook === book.name;
        const chs = bookChapters[book.name] ?? [];
        const chCount = chs.length;

        return (
          <div key={book.name} className="rounded-xl overflow-hidden border border-white/10 dark:border-white/10">
            {/* Book header / accordion toggle */}
            <button
              onClick={() => setOpenBook(isOpen ? null : book.name)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-gradient-to-r from-neutral-700/60 to-neutral-800/60 hover:from-neutral-700/80 hover:to-neutral-800/80 transition-colors"
            >
              <div>
                <span className="font-semibold text-white text-sm">{book.name}</span>
                <span className="ml-3 text-xs text-white/40">
                  Ch {book.chapter_start}–{book.chapter_end} · {chCount} chapter
                </span>
              </div>
              <span
                className={`text-white/50 text-lg transition-transform duration-200 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                ▾
              </span>
            </button>

            {/* Chapter list (shown when open) */}
            {isOpen && (
              <div className="divide-y divide-white/5 bg-neutral-900/60">
                {chCount === 0 ? (
                  <p className="px-5 py-4 text-sm text-white/40">
                    Belum ada chapter untuk {book.name}.
                  </p>
                ) : (
                  chs.map((ch) => (
                    <button
                      key={ch.number}
                      onClick={() => router.push(`/read/${novel.slug}/${ch.number}`)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/5 transition-colors text-sm"
                    >
                      <span className="text-white/30 font-mono text-xs w-10 shrink-0 text-right">
                        {ch.number}
                      </span>
                      <span className="text-white/80 line-clamp-1">
                        {ch.title || `Chapter ${ch.number}`}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
