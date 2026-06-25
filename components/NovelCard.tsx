import Link from "next/link";
import type { Novel } from "@/lib/types";

interface Props {
  novel: Novel;
  chapterCount?: number;
  totalWords?: number;
}

const statusColor: Record<string, string> = {
  ongoing: "bg-emerald-500/90",
  completed: "bg-blue-500/90",
  hiatus: "bg-amber-500/90",
};

const statusLabel: Record<string, string> = {
  ongoing: "Ongoing",
  completed: "Tamat",
  hiatus: "Hiatus",
};

const typeLabel: Record<string, string> = {
  translated: "Terjemahan",
  original: "Original",
};

export default function NovelCard({ novel, chapterCount, totalWords }: Props) {
  return (
    <Link
      href={`/novel/${novel.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-accent/20 to-accent/5 overflow-hidden">
        {novel.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={novel.cover}
            alt={novel.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="text-5xl mb-3 opacity-30">📖</div>
            <div className="font-serif font-bold text-base line-clamp-3 leading-tight">
              {novel.title}
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase text-white ${statusColor[novel.status] ?? "bg-gray-500"}`}>
            {statusLabel[novel.status] ?? novel.status}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur">
            {typeLabel[novel.type] ?? novel.type}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {novel.title}
        </h3>
        {novel.author && (
          <p className="text-xs opacity-70 line-clamp-1">oleh {novel.author}</p>
        )}
        <div className="mt-auto flex items-center justify-between text-[11px] opacity-60">
          <span className="line-clamp-1">
            {novel.genres.slice(0, 2).join(" · ")}
          </span>
          {chapterCount !== undefined && (
            <span className="shrink-0 ml-2 font-mono">{chapterCount} ch</span>
          )}
        </div>
      </div>
    </Link>
  );
}
