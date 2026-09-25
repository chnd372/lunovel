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
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5 hover:shadow-glow hover:-translate-y-1 transition-all duration-500"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black/5 dark:bg-white/5">
        {/* Cover Background Blur for Ambience */}
        {novel.cover && (
           <div className="absolute inset-0 scale-150 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 z-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={novel.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
           </div>
        )}

        <div className="relative z-10 w-full h-full p-2">
          <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/10 relative">
            {novel.cover ? (
              <>
                {/* Shimmer sweep effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite] z-20 pointer-events-none" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={novel.cover}
                  alt={novel.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-accent/20 to-accent/5">
                <div className="text-5xl mb-3 opacity-30 group-hover:scale-110 transition-transform duration-500">📖</div>
                <div className="font-serif font-bold text-base line-clamp-3 leading-tight drop-shadow-md">
                  {novel.title}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-30 flex flex-col sm:flex-row gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${statusColor[novel.status] ?? "bg-gray-500"}`}>
            {statusLabel[novel.status] ?? novel.status}
          </span>
        </div>
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-30 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md text-[8px] sm:text-[10px] font-bold tracking-wider uppercase bg-black/50 text-white backdrop-blur-md border border-white/10 shadow-sm">
            {typeLabel[novel.type] ?? novel.type}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-2 sm:p-3 flex flex-col gap-1 flex-1 relative z-10 bg-gradient-to-b from-transparent to-white/10 dark:to-black/10">
        <h3 className="font-heading font-bold text-sm sm:text-base leading-tight line-clamp-2 md:group-hover:text-accent active:text-accent transition-colors duration-300">
          {novel.title}
        </h3>
        {novel.author && (
          <p className="text-[10px] sm:text-xs opacity-70 line-clamp-1 font-medium">oleh {novel.author}</p>
        )}
        <div className="mt-auto pt-1.5 flex items-center justify-between text-[9px] sm:text-[11px] font-semibold opacity-60">
          <span className="line-clamp-1 uppercase tracking-wide">
            {novel.genres.slice(0, 2).join(" · ")}
          </span>
          {chapterCount !== undefined && (
            <span className="shrink-0 ml-1.5 font-mono bg-black/5 dark:bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md">
              {chapterCount} CH
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}