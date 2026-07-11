import type { Chapter } from "./types";
import moipMeta from "@/data/chapters/moip-meta.json";
import wmwMeta from "@/data/chapters/warlock-meta.json";

interface ChapterMetaEntry {
  chunk_idx: number;
  local_idx: number;
  title: string;
  word_count: number;
}

interface NovelMeta {
  novel_id: string;
  total_chapters: number;
  chunks: number;
  chunk_size: number;
  chapter_map: Record<string, ChapterMetaEntry>;
}

const META: Record<string, NovelMeta> = {
  moip: moipMeta as NovelMeta,
  "warlock-of-magus-world": wmwMeta as NovelMeta,
};

async function loadChunk(novelId: string, chunkIdx: number): Promise<Chapter[]> {
  const pad = String(chunkIdx).padStart(2, "0");
  const mod = await import(`@/data/chapters/${novelId}-content-${pad}.json`);
  return mod.default as Chapter[];
}

function findMeta(novelId: string): NovelMeta | null {
  return META[novelId] ?? null;
}

export async function getChunkedChapter(
  novelId: string,
  chapterNumber: number,
): Promise<Chapter | null> {
  const meta = findMeta(novelId);
  if (!meta) return null;

  const normKey = (n: number) => (n % 1 === 0 ? String(Math.floor(n)) : String(n));
  const key = normKey(chapterNumber);
  const entry = meta.chapter_map[key] ?? meta.chapter_map[String(chapterNumber)];
  if (!entry) return null;

  const chunk = await loadChunk(novelId, entry.chunk_idx);
  return chunk[entry.local_idx] ?? null;
}

export async function getChunkedChapterList(
  novelId: string,
): Promise<Chapter[] | null> {
  const meta = findMeta(novelId);
  if (!meta) return null;

  const keys = Object.keys(meta.chapter_map).sort(
    (a, b) => parseFloat(a) - parseFloat(b),
  );

  // Lightweight list: number + title + word_count + published_at, no content.
  // Returns empty content; chapter page uses getChunkedChapter() for full text.
  // ponytail: stable per-chapter dates derived from chapter number; replace with
  // real upload timestamps once chapter-level metadata exists in the source.
  const total = keys.length;
  return keys.map((k, idx) => {
    const number = parseFloat(k);
    // Distribute across (total) days ending at "today" UTC midnight so the last
    // chapter is ~1 day old and the first is ~total days old. Only chapters
    // within the last 3 days will get the UP badge.
    const daysAgo = Math.max(1, total - idx);
    const published_at = new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate() - daysAgo,
    )).toISOString();
    return {
      id: `${novelId}-ch${k.replace(".", "_")}`,
      novel_id: novelId,
      number,
      title: meta.chapter_map[k].title,
      content: "",
      word_count: meta.chapter_map[k].word_count,
      published_at,
    };
  });
}