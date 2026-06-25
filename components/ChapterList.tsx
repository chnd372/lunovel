import Link from "next/link";
import type { Chapter, Novel } from "@/lib/types";
import { estimateReadingMinutes } from "@/lib/data";

interface Props {
  novel: Novel;
  chapters: Chapter[];
  currentChapter?: number;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}h lalu`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}bln lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "short" });
}

export default function ChapterList({ novel, chapters, currentChapter }: Props) {
  if (chapters.length === 0) {
    return (
      <div className="text-center py-12 opacity-60">
        <p>Belum ada chapter yang dipublikasikan.</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-black/5 dark:divide-white/5">
      {chapters.map((ch) => {
        const isCurrent = ch.number === currentChapter;
        const minutes = estimateReadingMinutes(ch.word_count);
        return (
          <Link
            key={ch.id}
            href={`/read/${novel.slug}/${ch.number}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/5 transition-colors ${
              isCurrent ? "bg-accent/10 border-l-2 border-accent" : ""
            }`}
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center font-mono text-xs font-bold">
              #{ch.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-1">
                {ch.title || `Chapter ${ch.number}`}
              </div>
              <div className="text-xs opacity-60 flex items-center gap-3 mt-0.5">
                <span>{ch.word_count.toLocaleString("id-ID")} kata</span>
                <span>·</span>
                <span>~{minutes} menit baca</span>
                <span>·</span>
                <span>{timeAgo(ch.published_at)}</span>
              </div>
            </div>
            {isCurrent && (
              <span className="shrink-0 text-[10px] font-bold uppercase text-accent">
                Sedang dibaca
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
