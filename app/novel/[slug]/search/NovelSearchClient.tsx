"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import type { Novel, Chapter } from "@/lib/types";

interface Props {
  novel: Novel;
}

interface SearchResult {
  chapterNumber: number;
  chapterTitle: string;
  snippet: string;
}

export default function NovelSearchClient({ novel }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0); // Chunks loaded progress %
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      setError("Kata kunci minimal 2 karakter.");
      return;
    }

    setError(null);
    setSearching(true);
    setResults([]);
    setProgress(0);

    try {
      // 1. Fetch meta to know how many chunks we have
      const metaRes = await fetch(`/data/chapters/${novel.id}-meta.json`);
      if (!metaRes.ok) throw new Error("Gagal mengambil meta novel.");
      const meta = await metaRes.json();
      const chunksCount = meta.chunks;

      const found: SearchResult[] = [];

      // 2. Fetch chunks sequentially or in parallel batches
      for (let i = 0; i < chunksCount; i++) {
        const chunkPath = `/data/chapters/${novel.id}-content-${String(i).padStart(2, "0")}.json`;
        const res = await fetch(chunkPath);
        if (res.ok) {
          const chapters: Chapter[] = await res.json();
          
          for (const ch of chapters) {
            const contentLower = ch.content.toLowerCase();
            let idx = contentLower.indexOf(q);
            if (idx !== -1) {
              // Extract snippet
              const start = Math.max(0, idx - 80);
              const end = Math.min(ch.content.length, idx + q.length + 80);
              let snippet = ch.content.slice(start, end).replace(/\n/g, " ").trim();
              
              if (start > 0) snippet = "..." + snippet;
              if (end < ch.content.length) snippet = snippet + "...";

              found.push({
                chapterNumber: ch.number,
                chapterTitle: ch.title || `Chapter ${ch.number}`,
                snippet,
              });
            }
          }
        }
        setProgress(Math.round(((i + 1) / chunksCount) * 100));
      }

      setResults(found);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memproses pencarian isi novel. Pastikan koneksi internet stabil.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="text-xs opacity-60">
        <Link href="/" className="hover:underline">Beranda</Link>
        <span className="mx-2">/</span>
        <Link href={`/novel/${novel.slug}`} className="hover:underline">{novel.title}</Link>
        <span className="mx-2">/</span>
        <span className="font-semibold text-accent">Cari Isi</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-serif">Cari Isi Novel</h1>
        <p className="text-sm opacity-60">Cari kata, nama tokoh, atau dialog di seluruh chapter novel <span className="font-semibold">{novel.title}</span>.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Masukkan kata kunci (misal: Ning Zhuo, kultivasi, pedang)"
          className="flex-1 px-4 py-2.5 rounded-lg bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
          disabled={searching}
        />
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 min-w-[100px]"
        >
          {searching ? `🔎 ${progress}%` : "Cari"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Progress bar */}
      {searching && (
        <div className="space-y-1.5 animate-pulse">
          <div className="h-1.5 w-full bg-black/15 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] opacity-50 text-center">Menyisir seluruh chapter... ({progress}%)</p>
        </div>
      )}

      {/* Results */}
      {!searching && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs opacity-60">Ditemukan {results.length} kecocokan:</p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <Link
                key={i}
                href={`/read/${novel.slug}/${r.chapterNumber}`}
                className="block p-4 rounded-xl bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:bg-accent/5 hover:border-accent/20 transition-all space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-accent">Chapter {r.chapterNumber}</span>
                  <span className="text-xs opacity-50 truncate max-w-[200px]">{r.chapterTitle}</span>
                </div>
                <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans" dangerouslySetInnerHTML={{
                  __html: r.snippet.replace(new RegExp(`(${query})`, "gi"), '<mark class="bg-amber-400/30 text-amber-500 font-semibold p-0.5 rounded">$1</mark>')
                }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searching && results.length === 0 && query && progress === 100 && (
        <div className="text-center py-12 opacity-60 text-sm">
          Tidak ada chapter yang mengandung kata "{query}".
        </div>
      )}
    </div>
  );
}
