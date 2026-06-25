import type { Novel, Chapter } from "./types";

/**
 * Data access layer.
 * - Tries Supabase first if env vars are set
 * - Falls back to local JSON in /data (zero-config)
 * 
 * IMPORTANT: This file must not import 'fs' directly.
 * All JSON data is imported statically so Next.js can bundle it.
 */

import { supabase, hasSupabase } from "./supabase";

// Static imports — bundled at build time
import novelsData from "@/data/novels.json";
import moipChapters from "@/data/chapters/moip.json";
import laskarChapters from "@/data/chapters/laskar-pelangi.json";
import sherlockChapters from "@/data/chapters/sherlock-holmes-collection.json";

const chaptersMap: Record<string, Chapter[]> = {
  moip: moipChapters as Chapter[],
  "laskar-pelangi": laskarChapters as Chapter[],
  "sherlock-holmes-collection": sherlockChapters as Chapter[],
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
    (b.updated_at ?? "").localeCompare(a.updated_at ?? "")
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
  return (chaptersMap[novelId] ?? []).sort((a, b) => a.number - b.number);
}

export async function getChapter(
  novelId: string,
  chapterNumber: number,
): Promise<Chapter | null> {
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

/** Estimate reading time in minutes (200 words/min average) */
export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}
