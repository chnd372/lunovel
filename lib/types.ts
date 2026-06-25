export type NovelStatus = "ongoing" | "completed" | "hiatus";
export type NovelType = "translated" | "original";
export type ReaderTheme = "light" | "sepia" | "dark";

export interface Novel {
  id: string;
  slug: string;
  title: string;
  alt_titles?: string[];
  author?: string;
  artist?: string;          // untuk cover artist / illustrator
  status: NovelStatus;
  type: NovelType;
  genres: string[];
  description: string;
  cover?: string;           // optional cover image URL
  release_year?: number;
  rating?: number;          // 0-5
  language: "id" | "en";    // bahasa konten
  original_language?: string; // bahasa asal kalau translated
  created_at?: string;
  updated_at?: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  number: number;
  title?: string;
  content: string;          // full chapter text (paragraphs separated by \n\n)
  word_count: number;
  published_at: string;
}

export interface Bookmark {
  novel_id: string;
  created_at: string;
}

export interface HistoryEntry {
  novel_id: string;
  chapter_id: string;
  chapter_number: number;
  scroll_percent: number;   // 0-100, replaces 'page' for novels
  read_at: string;
}

export interface ReaderSettings {
  theme: ReaderTheme;
  font_size: number;        // px, default 18
  line_height: number;      // multiplier, default 1.8
  max_width: number;        // px, default 720
  font_family: "serif" | "sans" | "mono";
}
