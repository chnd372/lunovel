import type { Novel, Chapter } from "./types";

/**
 * Data access layer for Lunovel.
 * - Tries Supabase first if env vars are set
 * - Falls back to local JSON in /data (zero-config)
 */

import { supabase, hasSupabase } from "./supabase";
import { getChunkedChapter, getChunkedChapterList } from "./chunks";

import novelsData from "@/data/novels.json";
import laskarPelangiData from "@/data/chapters/laskar-pelangi.json";
import sherlockData from "@/data/chapters/sherlock-holmes-collection.json";
import wmwData from "@/data/chapters/warlock-of-magus-world.json";

const chapterData: Record<string, Chapter[]> = {
  "laskar-pelangi": laskarPelangiData as Chapter[],
  "sherlock-holmes-collection": sherlockData as Chapter[],
  "warlock-of-magus-world": wmwData as Chapter[],
};

export async function getAllNovels(): Promise<Novel[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("novels")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) return data as Novel[];
  }
  return (novelsData as Novel[]).sort((a, b) =>
    (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
  );
}

export async function getNovelBySlug(slug: string): Promise<Novel | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("novels")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return data as Novel;
  }
  return (novelsData as Novel[]).find((s) => s.slug === slug) ?? null;
}

export async function getChaptersByNovel(novelId: string): Promise<Chapter[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("novel_id", novelId)
      .order("number", { ascending: true });
    if (!error && data) return data as Chapter[];
  }
  // Chunked novels (e.g. moip): return lightweight list (no content)
  const chunkedList = await getChunkedChapterList(novelId);
  if (chunkedList) return chunkedList;
  return (chapterData[novelId] ?? []).sort((a, b) => a.number - b.number);
}

export async function getChapter(
  novelId: string,
  chapterNumber: number,
): Promise<Chapter | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("novel_id", novelId)
      .eq("number", chapterNumber)
      .maybeSingle();
    if (!error && data) return data as Chapter;
  }
  // Chunked novels: load only the relevant chunk
  const chunked = await getChunkedChapter(novelId, chapterNumber);
  if (chunked) return chunked;
  const list = await getChaptersByNovel(novelId);
  return list.find((c) => c.number === chapterNumber) ?? null;
}

export async function searchNovels(query: string, filters?: {
  genre?: string;
  status?: string;
  type?: string;
}): Promise<Novel[]> {
  const all = await getAllNovels();
  const q = query.toLowerCase().trim();
  return all.filter((s) => {
    if (q) {
      const hay = [s.title, ...(s.alt_titles ?? []), s.author, s.artist, s.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters?.genre && !s.genres.includes(filters.genre)) return false;
    if (filters?.status && s.status !== filters.status) return false;
    if (filters?.type && s.type !== filters.type) return false;
    return true;
  });
}

export function allGenres(novels: Novel[]): string[] {
  const set = new Set<string>();
  novels.forEach((s) => s.genres.forEach((g) => set.add(g)));
  return Array.from(set).sort();
}

export interface ChapterWithNovel {
  novel: Novel;
  chapter: Chapter;
}

/** Latest chapters across all novels, sorted by published_at desc. */
export async function getLatestChapters(limit = 10): Promise<ChapterWithNovel[]> {
  const novels = await getAllNovels();
  const groups = await Promise.all(
    novels.map(async (n) => {
      const chapters = await getChaptersByNovel(n.id);
      return chapters.map((c) => ({ novel: n, chapter: c }));
    }),
  );
  return groups
    .flat()
    .sort((a, b) => b.chapter.published_at.localeCompare(a.chapter.published_at))
    .slice(0, limit);
}

/** Estimate reading time in minutes (200 words/min average) */
export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}