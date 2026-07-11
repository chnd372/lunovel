import Link from "next/link";
import type { Novel } from "@/lib/types";

interface Item {
  novel: Novel;
  chapterCount: number;
}

interface Props {
  items: Item[];
}

/** Mobile-only compact featured novel slider. Swipeable horizontal row.
 *  ponytail: hidden md:hidden wrapper in caller. Upgrade to snap-x when
 *  you want strict snap-stop on each card. */
export default function MobileFeaturedSlider({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Featured novels" className="-mx-3">
      <div className="px-3 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">
          ⭐ Featured
        </h2>
        <span className="text-[10px] opacity-50">← swipe →</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto px-3 pb-2 snap-x snap-mandatory scrollbar-none">
        {items.map(({ novel, chapterCount }) => (
          <Link
            key={novel.id}
            href={`/novel/${novel.slug}`}
            className="snap-start shrink-0 w-[88vw] max-w-[420px] relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-card-light dark:bg-card-dark active:scale-[0.98] transition-transform"
          >
            {/* Background = blurred cover, faded */}
            {novel.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={novel.cover}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30"
              />
            )}
            {/* Solid overlay so text stays readable on any cover */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative flex items-center gap-3 p-3 min-h-[170px]">
              {/* Cover thumbnail */}
              <div className="shrink-0 w-[100px] aspect-[3/4] rounded-lg overflow-hidden bg-black/40 shadow-lg ring-1 ring-white/10">
                {novel.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={novel.cover}
                    alt={novel.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 text-white">
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {novel.genres.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif font-bold text-base leading-tight line-clamp-2 mb-1">
                  {novel.title}
                </h3>
                <p className="text-[11px] line-clamp-2 opacity-80 mb-2">
                  {novel.description}
                </p>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold">
                  Buka Novel →
                </span>
              </div>
            </div>
            {/* Chapter count badge bottom-right */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white backdrop-blur-sm">
              {chapterCount} ch
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
