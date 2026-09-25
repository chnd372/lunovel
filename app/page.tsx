import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllNovels,
  getChaptersByNovel,
  allGenres,
  getLatestChapters,
} from "@/lib/data";
import NovelCard from "@/components/NovelCard";
import ContinueReading from "@/components/ContinueReading";
import SiteStats from "@/components/SiteStats";
import HomeTabs from "@/components/HomeTabs";
import MobileFeaturedSlider from "@/components/MobileFeaturedSlider";
import MobileLatestChapters from "@/components/MobileLatestChapters";

export const dynamic = "force-dynamic";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";

export const metadata: Metadata = {
  title: `${siteName} - Baca Novel Gratis Online`,
  description: "Baca ribuan chapter novel terjemahan & original bahasa Indonesia. Online, gratis, tanpa iklan. Ongoing & completed, update setiap hari.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const novels = await getAllNovels();
  const genres = allGenres(novels);

  // Compute chapter counts + total words for each novel
  const enriched = await Promise.all(
    novels.map(async (n) => {
      const chapters = await getChaptersByNovel(n.id);
      return {
        novel: n,
        chapterCount: chapters.length,
        totalWords: chapters.reduce((s, c) => s + c.word_count, 0),
        lastChapter: chapters[chapters.length - 1],
      };
    })
  );

  const featured = enriched[0];
  const rest = enriched.slice(1);
  const latestChapters = await getLatestChapters(8);

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-6 space-y-4 md:space-y-8">
      {/* === DESKTOP HERO (md+) — JAW-DROPPING REDESIGN === */}
      <section className="hidden md:flex relative rounded-3xl overflow-hidden min-h-[400px] border border-black/5 dark:border-white/5 shadow-2xl items-center group">
        {/* Immersive Blurred Background */}
        <div className="absolute inset-0 bg-black/90 z-0">
          {featured?.novel.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={featured?.novel.cover || ""} 
              alt="cover" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-3xl scale-110 group-hover:scale-125 group-hover:opacity-50 transition-all duration-[2s] ease-out" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-light/95 via-bg-light/80 to-transparent dark:from-bg-dark/95 dark:via-bg-dark/80 z-10" />
        </div>

        <div className="relative z-20 px-10 py-12 flex flex-row items-center gap-10 w-full">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-accent font-bold">Terpopuler Hari Ini</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-heading font-extrabold leading-[1.1] tracking-tight drop-shadow-sm">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-black to-black/60 dark:from-white dark:to-white/60">
                {featured?.novel.title || "Selamat datang di Lunovel"}
              </span>
            </h1>
            
            <p className="text-base lg:text-lg opacity-80 max-w-xl font-medium leading-relaxed">
              {featured?.novel.description?.slice(0, 150) || "Ribuan chapter novel terjemahan & original bahasa Indonesia. Baca online, tanpa batas, tanpa iklan."}...
            </p>
            
            <div className="flex gap-4 pt-4">
              <Link
                href={`/novel/${featured?.novel.slug}`}
                className="px-8 py-3.5 rounded-xl bg-accent text-white text-sm font-bold shadow-glow hover:-translate-y-1 transition-all duration-300"
              >
                Mulai Baca
              </Link>
              <Link
                href="/search"
                className="px-8 py-3.5 rounded-xl bg-black/5 dark:bg-white/10 text-sm font-bold backdrop-blur-md border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all duration-300"
              >
                Jelajahi Novel
              </Link>
            </div>
          </div>

          {/* 3D Floating Cover Card */}
          {featured?.novel.cover && (
            <div className="shrink-0 relative group/cover perspective-[1000px] hidden lg:block">
              <div className="w-[280px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform rotate-y-[-10deg] rotate-x-[5deg] group-hover/cover:rotate-y-0 group-hover/cover:rotate-x-0 transition-transform duration-700 ease-out z-20 relative bg-black">
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={featured?.novel.cover || ""} 
                  alt={featured?.novel.title || ""} 
                  className="w-full h-full object-cover group-hover/cover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-bold uppercase tracking-widest text-accent mb-1">{featured?.novel.author}</div>
                  <div className="font-mono text-sm">{featured?.chapterCount} Chapters</div>
                </div>
              </div>
              {/* Fake reflection */}
              <div className="absolute -bottom-10 left-0 right-0 h-1/2 bg-gradient-to-b from-black/20 to-transparent blur-2xl z-0 transform -skew-x-12" />
            </div>
          )}
        </div>
      </section>

      {/* === MOBILE HERO REPLACEMENT (mobile only) === */}
      {enriched.length > 0 && (
        <div className="md:hidden">
          <MobileFeaturedSlider
            items={enriched.slice(0, 3).map((e) => ({
              novel: e.novel,
              chapterCount: e.chapterCount,
            }))}
          />
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📚</p>
          <h2 className="text-xl font-bold mb-2">Belum ada novel</h2>
          <p className="opacity-70 text-sm">
            Tambah novel di <code className="px-1 bg-black/10 dark:bg-white/10 rounded">data/novels.json</code> atau setup Supabase.
          </p>
        </div>
      ) : (
        <>
          {/* Continue Reading — client-side, only shows if user has history.
              On mobile we hide it because BottomNav already exposes "Baca". */}
          <div className="hidden md:block">
            <ContinueReading />
          </div>

          {/* Site Stats — desktop only */}
          <div className="hidden md:block">
            <SiteStats />
          </div>

          {/* === MOBILE: Update Terbaru (horizontal compact grid) === */}
          {rest.length > 0 && (
            <section className="md:hidden">
              <div className="flex items-center justify-between mb-2 px-0">
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-80">
                  📚 Update Terbaru
                </h2>
                <Link
                  href="/search"
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  LIHAT SEMUA →
                </Link>
              </div>
              <div className="-mx-3 overflow-x-auto scrollbar-none">
                <div className="flex gap-2.5 px-3 pb-1">
                  {enriched.map(({ novel, chapterCount, lastChapter }) => (
                    <Link
                      key={novel.id}
                      href={`/novel/${novel.slug}`}
                      className="shrink-0 w-[30vw] max-w-[140px] group"
                    >
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-accent/10 mb-1.5">
                        {novel.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={novel.cover}
                            alt={novel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                        )}
                      </div>
                      <div className="text-xs font-semibold leading-tight line-clamp-1">
                        {novel.title}
                      </div>
                      {lastChapter && (
                        <div className="text-[10px] opacity-60 line-clamp-1">
                          Chapter {lastChapter.number}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* === DESKTOP: Featured card (unchanged) === */}
          {featured && (
            <section className="hidden md:block">
              <Link
                href={`/novel/${featured?.novel.slug}`}
                className="block group rounded-xl overflow-hidden bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:shadow-lg transition-all"
              >
                <div className="grid sm:grid-cols-3 gap-0">
                  <div className="aspect-square sm:aspect-auto sm:max-h-64 bg-gradient-to-br from-accent/30 to-accent/5 flex items-center justify-center p-6">
                    {featured?.novel.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured?.novel.cover}
                        alt={featured?.novel.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-9xl opacity-30">📖</div>
                    )}
                  </div>
                  <div className="sm:col-span-2 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-accent mb-2">
                      <span>★ Featured</span>
                      <span>·</span>
                      <span className="text-emerald-500">{featured?.novel.status}</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold leading-tight group-hover:text-accent transition-colors">
                      {featured?.novel.title}
                    </h2>
                    {featured?.novel.author && (
                      <p className="text-sm opacity-70 mt-1">oleh {featured?.novel.author}</p>
                    )}
                    <p className="text-sm opacity-80 line-clamp-3 leading-relaxed mt-4">
                      {featured?.novel.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs opacity-70">
                      <span>📚 {featured?.chapterCount} chapter</span>
                      <span>✍️ {featured?.totalWords?.toLocaleString("id-ID")} kata</span>
                      {featured?.lastChapter && (
                        <span>📌 Ch {featured.lastChapter.number}: {featured.lastChapter.title}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* === MOBILE: Latest chapters list === */}
          <MobileLatestChapters items={latestChapters} />

          {/* === DESKTOP: Genre-based tabs + Update Terbaru === */}
          <section className="hidden md:block">
            <HomeTabs enriched={enriched} />
          </section>

          {/* === DESKTOP: Quick genre links (hidden on mobile — moved to drawer) === */}
          {genres.length > 0 && (
            <section className="hidden md:block">
              <h2 className="text-lg sm:text-xl font-bold mb-3">Jelajahi Genre</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="px-3 py-1.5 text-sm rounded-full bg-black/5 dark:bg-white/10 hover:bg-accent hover:text-white transition"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
