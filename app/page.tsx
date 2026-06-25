import Link from "next/link";
import { getAllNovels, getChaptersByNovel, allGenres, estimateReadingMinutes } from "@/lib/data";
import NovelCard from "@/components/NovelCard";

export const dynamic = "force-dynamic";

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent/20">
        <div className="px-6 sm:px-10 py-8 sm:py-12 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 space-y-3">
            <div className="text-xs uppercase tracking-widest text-accent font-bold">
              🌙 Baca novel gratis
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight">
              Selamat datang di <span className="text-accent">Lunovel</span>
            </h1>
            <p className="text-sm sm:text-base opacity-80 max-w-xl">
              Ribuan chapter novel terjemahan & original bahasa Indonesia. Baca online,
              tanpa batas, tanpa iklan. Bookmark, atur tampilan, lanjut dari mana lo berhenti.
            </p>
            <div className="flex gap-2 pt-1">
              <Link
                href="/search?status=ongoing"
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90"
              >
                Lihat Ongoing
              </Link>
              <Link
                href="/search?type=translated"
                className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20"
              >
                Novel Terjemahan
              </Link>
            </div>
          </div>
          <div className="shrink-0 text-7xl sm:text-9xl opacity-20 select-none">📖</div>
        </div>
      </section>

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
          {/* Featured */}
          {featured && (
            <section>
              <Link
                href={`/novel/${featured.novel.slug}`}
                className="block group rounded-xl overflow-hidden bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:shadow-lg transition-all"
              >
                <div className="grid sm:grid-cols-3 gap-0">
                  <div className="aspect-square sm:aspect-auto sm:max-h-64 bg-gradient-to-br from-accent/30 to-accent/5 flex items-center justify-center p-6">
                    {featured.novel.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.novel.cover}
                        alt={featured.novel.title}
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
                      <span className="text-emerald-500">{featured.novel.status}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold group-hover:text-accent transition-colors line-clamp-2">
                      {featured.novel.title}
                    </h2>
                    {featured.novel.author && (
                      <p className="text-sm opacity-70 mt-1">oleh {featured.novel.author}</p>
                    )}
                    <p className="text-sm opacity-80 mt-3 line-clamp-3">
                      {featured.novel.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs opacity-70">
                      <span>📚 {featured.chapterCount} chapter</span>
                      <span>✍️ {featured.totalWords.toLocaleString("id-ID")} kata</span>
                      {featured.lastChapter && (
                        <span>📌 Ch {featured.lastChapter.number}: {featured.lastChapter.title}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Genre chips */}
          {genres.length > 0 && (
            <section>
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

          {/* Update terbaru */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold">Update Terbaru</h2>
              <Link href="/search" className="text-sm text-accent hover:underline">
                Lihat semua →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {enriched.slice(0, 6).map(({ novel, chapterCount, totalWords }) => (
                <NovelCard
                  key={novel.id}
                  novel={novel}
                  chapterCount={chapterCount}
                  totalWords={totalWords}
                />
              ))}
            </div>
          </section>

          {/* Sisanya */}
          {rest.length > 1 && (
            <section>
              <h2 className="text-lg sm:text-xl font-bold mb-3">Novel Lainnya</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {rest.slice(1).map(({ novel, chapterCount }) => (
                  <NovelCard key={novel.id} novel={novel} chapterCount={chapterCount} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
