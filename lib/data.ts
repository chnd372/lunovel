import type { Novel, Chapter } from "./types";

/**
 * Data access layer for Lunovel.
 * - Tries Supabase first if env vars are set
 * - Falls back to local JSON in /data (zero-config)
 * 
 * MOIP chapters are split into 19 chunks (~900 KB each) for Vercel compatibility.
 * Content is loaded on-demand per chunk, not all at once.
 */

import { supabase, hasSupabase } from "./supabase";

// Static imports — bundled at build time
import novelsData from "@/data/novels.json";
import moipMeta from "@/data/chapters/moip-meta.json";
import laskarChapters from "@/data/chapters/laskar-pelangi.json";
import sherlockChapters from "@/data/chapters/sherlock-holmes-collection.json";

// MOIP chunk imports (19 chunks, ~900 KB each)
import moipChunk00 from "@/data/chapters/moip-content-000.json";
import moipChunk01 from "@/data/chapters/moip-content-001.json";
import moipChunk02 from "@/data/chapters/moip-content-002.json";
import moipChunk03 from "@/data/chapters/moip-content-003.json";
import moipChunk04 from "@/data/chapters/moip-content-004.json";
import moipChunk05 from "@/data/chapters/moip-content-005.json";
import moipChunk06 from "@/data/chapters/moip-content-006.json";
import moipChunk07 from "@/data/chapters/moip-content-007.json";
import moipChunk08 from "@/data/chapters/moip-content-008.json";
import moipChunk09 from "@/data/chapters/moip-content-009.json";
import moipChunk10 from "@/data/chapters/moip-content-010.json";
import moipChunk11 from "@/data/chapters/moip-content-011.json";
import moipChunk12 from "@/data/chapters/moip-content-012.json";
import moipChunk13 from "@/data/chapters/moip-content-013.json";
import moipChunk14 from "@/data/chapters/moip-content-014.json";
import moipChunk15 from "@/data/chapters/moip-content-015.json";
import moipChunk16 from "@/data/chapters/moip-content-016.json";
import moipChunk17 from "@/data/chapters/moip-content-017.json";
import moipChunk18 from "@/data/chapters/moip-content-018.json";

const moipChunks: Record<string, string>[] = [
  moipChunk00, moipChunk01, moipChunk02, moipChunk03, moipChunk04,
  moipChunk05, moipChunk06, moipChunk07, moipChunk08, moipChunk09,
  moipChunk10, moipChunk11, moipChunk12, moipChunk13, moipChunk14,
  moipChunk15, moipChunk16, moipChunk17, moipChunk18,
];

const CHUNK_SIZE = 50; // must match the chunking script

/** Get content for a specific MOIP chapter by number */
function getMoipContent(chapterNumber: number): string | null {
  const chStr = String(chapterNumber);
  // Determine which chunk this chapter belongs to
  const idx = (moipMeta as any[]).findIndex((m: any) => m.number === chapterNumber);
  if (idx === -1) return null;
  const chunkIdx = Math.floor(idx / CHUNK_SIZE);
  if (chunkIdx < 0 || chunkIdx >= moipChunks.length) return null;
  const chunk = moipChunks[chunkIdx];
  return chunk[chStr] ?? null;
}

const otherChapters: Record<string, Chapter[]> = {
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
  
  if (novelId === "moip") {
    // Return metadata-only chapters (content loaded on demand in getChapter)
    return (moipMeta as any[]).map((m: any) => ({
      ...m,
      content: "", // Content loaded separately
    })) as Chapter[];
  }
  
  return (otherChapters[novelId] ?? []).sort((a, b) => a.number - b.number);
}

export async function getChapter(
  novelId: string,
  chapterNumber: number,
): Promise<Chapter | null> {
  if (novelId === "moip") {
    // Find metadata
    const meta = (moipMeta as any[]).find((m: any) => m.number === chapterNumber);
    if (!meta) return null;
    // Load content from chunk
    const content = getMoipContent(chapterNumber);
    if (!content) return null;
    return {
      ...meta,
      content,
    } as Chapter;
  }
  
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
