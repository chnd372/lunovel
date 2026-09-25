import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getNovelBySlug, getChaptersByNovel } from "@/lib/data";
import ChapterList from "@/components/ChapterList";
import BookAccordion from "@/components/BookAccordion";
import BookmarkButton from "@/components/BookmarkButton";
import ResumeReadingButton from "@/components/ResumeReadingButton";
import CorrectionPanel from "@/components/CorrectionPanel";
import Comments from "@/components/Comments";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";

// Sinopsis → meta description (≤ 160 chars, word-boundary safe).
function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const novel = await getNovelBySlug(slug);
  if (!novel) return { title: "Novel tidak ditemukan" };

  const description = truncate(novel.description || `${novel.title} — baca online gratis di ${SITE_NAME}.`);
  const ogImage = novel.cover
    ? [{ url: novel.cover, width: 800, height: 1200, alt: novel.title }]
    : undefined;

  return {
    title: novel.title,
    description,
    keywords: [novel.title, ...(novel.genres || []), novel.author].filter(Boolean) as string[],
    alternates: { canonical: `/novel/${novel.slug}` },
    openGraph: {
      type: "book",
      title: novel.title,
      description,
      url: `/novel/${novel.slug}`,
      siteName: SITE_NAME,
      locale: "id_ID",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: novel.title,
      description,
      images: ogImage?.map((i) => i.url),
    },
  };
}

type SortOrder = "newest" | "oldest";

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

export default async function NovelPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const novel = await getNovelBySlug(slug);
  if (!novel) notFound();

  const chapters = await getChaptersByNovel(novel.id);
  const totalWords = chapters.reduce((s, c) => s + c.word_count, 0);
  const lastChapter = chapters[chapters.length - 1];
  const firstChapter = chapters[0];
  const sort: SortOrder = query.sort === "oldest" ? "oldest" : "newest";
  const orderedChapters = sort === "oldest" ? chapters : chapters.slice().reverse();

  return (
    <div className="w-full">
      {/* Immersive Header */}
      <div className="relative w-full overflow-hidden bg-black/90 pb-8 pt-10 sm:pt-16 sm:pb-12 border-b border-white/10">
        {/* Background Blur */}
        {novel.cover && (
          <div className="absolute inset-0 z-0">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={novel.cover} alt="" className="w-full h-full object-cover opacity-20 blur-3xl scale-125" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-light dark:from-bg-dark to-transparent opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
          </div>
        )}
        
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 md:gap-10 items-start">
            {/* 3D Cover */}
            <div className="shrink-0 group perspective-[1000px] w-48 sm:w-56 mx-auto sm:mx-0">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 transform rotate-y-[-5deg] group-hover:rotate-y-0 transition-transform duration-500 ease-out bg-black/20 flex items-center justify-center relative">
                {novel.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={novel.cover} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="text-7xl opacity-30">📖</div>
                )}
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 text-center sm:text-left text-white/90 drop-shadow-sm pt-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${statusColor[novel.status]}`}>
                  {statusLabel[novel.status]}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/10">
                  {novel.type === "translated" ? "Terjemahan" : (novel.type ?? "Original")}
                </span>
                {novel.original_language && novel.original_language !== "id" && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-md border border-white/10">
                    dari {novel.original_language}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold leading-tight text-white drop-shadow-md">
                {novel.title}
              </h1>
              
              {novel.alt_titles && novel.alt_titles.length > 0 && (
                <p className="text-sm opacity-60 font-medium">
                  Alt: {novel.alt_titles.join(" · ")}
                </p>
              )}
              
              {novel.author && (
                <p className="text-sm sm:text-base font-medium">
                  <span className="opacity-60">oleh </span>
                  <span className="text-white">{novel.author}</span>
                </p>
              )}
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                {novel.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/search?genre=${encodeURIComponent(g)}`}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-accent text-white backdrop-blur-sm border border-white/10 transition-colors"
                  >
                    {g}
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center justify-center sm:justify-start gap-4 text-sm font-semibold opacity-80 pt-2">
                <span className="flex items-center gap-1.5"><span className="text-accent text-lg">📚</span> {chapters.length} CH</span>
                <span className="flex items-center gap-1.5"><span className="text-accent text-lg">✍️</span> {totalWords.toLocaleString("id-ID")} Kata</span>
                {novel.rating && <span className="flex items-center gap-1.5"><span className="text-yellow-400 text-lg">⭐</span> {novel.rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Actions & Synopsis Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Main Actions */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex flex-col gap-2">
              {firstChapter && (
                <Link
                  href={`/read/${novel.slug}/${firstChapter.number}`}
                  className="w-full text-center px-6 py-3.5 rounded-xl bg-accent text-white text-sm font-bold shadow-glow hover:-translate-y-0.5 transition-all"
                >
                  📖 Mulai dari Ch 1
                </Link>
              )}
              {lastChapter && (
                <Link
                  href={`/read/${novel.slug}/${lastChapter.number}`}
                  className="w-full text-center px-6 py-3.5 rounded-xl bg-black/5 dark:bg-white/10 text-sm font-bold border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all"
                >
                  ⏭ Chapter Terakhir
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <ResumeReadingButton novelId={novel.id} slug={novel.slug} />
              <BookmarkButton novel={novel} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/novel/${novel.slug}/perbaikan`}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-colors"
                title="Kelola perbaikan kata pribadi (tersimpan lokal)"
              >
                <span>✏️</span> Fix Kata
              </Link>
              <Link
                href={`/novel/${novel.slug}/search`}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black/5 dark:bg-white/5 text-xs font-semibold hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-colors"
                title="Cari kata kunci, nama tokoh, atau dialog di seluruh isi novel"
              >
                <span>🔍</span> Cari Isi
              </Link>
            </div>
          </div>
          
          {/* Synopsis */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-heading font-bold mb-3 flex items-center gap-2">
              <span className="text-accent">|</span> Sinopsis
            </h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-black/80 dark:text-white/80 leading-loose">
              <p className="whitespace-pre-line">{novel.description}</p>
            </div>
          </div>
        </div>

        {/* Chapter list */}
        <section className="mt-12">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-bold">Daftar Chapter</h2>
          <span className="text-xs opacity-60">{chapters.length} entries</span>
        </div>
        
        {novel.books && novel.books.length > 0 ? (
          <BookAccordion novel={novel} chapters={chapters} />
        ) : (
          <div className="rounded-xl overflow-hidden bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5">
            <ChapterList novel={novel} chapters={orderedChapters} />
          </div>
        )}
      </section>

      {/* Novel-level discussion (separate from chapter-threaded comments) */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-bold">Diskusi Novel</h2>
          <span className="text-xs opacity-60">Topik umum · tidak terikat chapter</span>
        </div>
        <Comments
          chapterId={`novel:${novel.slug}`}
          novelId={novel.id}
        />
      </section>
    </div>
    </div>
  );
}
