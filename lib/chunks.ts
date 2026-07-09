import type { Chapter } from "./types";
import moipMeta from "@/data/chapters/moip-meta.json";

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

const MOIP_META = moipMeta as NovelMeta;

async function loadChunk(novelId: string, chunkIdx: number): Promise<Chapter[]> {
  const pad = String(chunkIdx).padStart(2, "0");
  const mod = await import(`@/data/chapters/${novelId}-content-${pad}.json`);
  return mod.default as Chapter[];
}

function findMeta(novelId: string): NovelMeta | null {
  return novelId === "moip" ? MOIP_META : null;
}

export async function getChunkedChapter(
  novelId: string,
  chapterNumber: number,
): Promise<Chapter | null> {
  const meta = findMeta(novelId);
  if (!meta) return null;

  const key = chapterNumber % 1 === 0 ? String(Math.floor(chapterNumber)) : String(chapterNumber);
  const entry = meta.chapter_map[key];
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

  // Lightweight list: number + title + word_count, no content.
  // Returns empty content; chapter page uses getChunkedChapter() for full text.
  return keys.map((k) => ({
    id: `${novelId}-ch${k.replace(".", "_")}`,
    novel_id: novelId,
    number: parseFloat(k),
    title: meta.chapter_map[k].title,
    content: "",
    word_count: meta.chapter_map[k].word_count,
    published_at: "2026-07-09T00:00:00Z",
  }));
}