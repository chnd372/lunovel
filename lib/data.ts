import type { Novel, Chapter } from "./types";
import fs from "fs/promises";
import path from "path";

/**
 * Data access layer.
 * - Tries Supabase first if env vars are set
 * - Falls back to local JSON in /data (zero-config)
 */

import { supabase, hasSupabase } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJSON<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

export async function getAllNovels(): Promise<Novel[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("novels")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) return data as Novel[];
  }
  const list = await readJSON<Novel[]>("novels.json");
  return list.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
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
  const list = await readJSON<Novel[]>("novels.json");
  return list.find((s) => s.slug === slug) ?? null;
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
  try {
    const list = await readJSON<Chapter[]>(`chapters/${novelId}.json`);
    return list.sort((a, b) => a.number - b.number);
  } catch {
    return [];
  }
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
