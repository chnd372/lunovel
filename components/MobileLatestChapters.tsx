import Link from "next/link";
import type { Novel } from "@/lib/types";
import type { Chapter } from "@/lib/types";

interface Item {
  novel: Novel;
  chapter: Chapter;
}

interface Props {
  items: Item[];
}

const TWO_MIN = 2 * 60_000;
const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return "baru";
  if (diff < TWO_MIN) return "baru saja";
  if (diff < HOUR) return `${Math.floor(diff / 60_000)} menit lalu`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} jam lalu`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/** Mobile-only compact list of latest chapters across all novels. */
export default function MobileLatestChapters({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="md:hidden">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">
          📑 Chapter Terbaru
        </h2>
        <Link
          href="/search?sort=latest"
          className="text-[11px] font-semibold text-accent hover:underline"
        >
          LIHAT SEMUA →
        </Link>
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/5 rounded-xl overflow-hidden bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5">
        {items.map(({ novel, chapter }) => (
          <li key={`${novel.id}-${chapter.number}`}>
            <Link
              href={`/read/${novel.slug}/${chapter.number}`}
              className="flex items-center gap-3 p-2.5 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors"
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-[40px] h-[55px] rounded overflow-hidden bg-accent/10 flex items-center justify-center">
                {novel.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={novel.cover}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">📖</span>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-tight line-clamp-1">
                  {novel.title}
                </div>
                <div className="text-[11px] opacity-70 mt-0.5 line-clamp-1">
                  Chapter {chapter.number}
                  {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                    <span className="opacity-60"> · {chapter.title}</span>
                  )}
                </div>
              </div>
              {/* Time */}
              <div className="shrink-0 text-[10px] opacity-50 font-mono">
                {timeAgo(chapter.published_at)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
