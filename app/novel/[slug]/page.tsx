import { notFound } from "next/navigation";
import Link from "next/link";
import { getNovelBySlug, getChaptersByNovel } from "@/lib/data";
import ChapterList from "@/components/ChapterList";
import BookmarkButton from "@/components/BookmarkButton";
import CorrectionPanel from "@/components/CorrectionPanel";
import Comments from "@/components/Comments";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
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

export default async function NovelPage({ params }: Props) {
  const novel = await getNovelBySlug(params.slug);
  if (!novel) notFound();

  const chapters = await getChaptersByNovel(novel.id);
  const totalWords = chapters.reduce((s, c) => s + c.word_count, 0);
  const lastChapter = chapters[chapters.length - 1];
  const firstChapter = chapters[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="grid sm:grid-cols-[200px_1fr] gap-6 mb-6">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          {novel.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={novel.cover}
              alt={novel.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-7xl opacity-30">📖</div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${statusColor[novel.status]}`}>
              {statusLabel[novel.status]}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/5 dark:bg-white/10">
              {novel.type === "translated" ? "Terjemahan" : "Original"}
            </span>
            {novel.original_language && novel.original_language !== "id" && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/5 dark:bg-white/10">
                dari {novel.original_language.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold leading-tight">
            {novel.title}
          </h1>
          {novel.alt_titles && novel.alt_titles.length > 0 && (
            <p className="text-sm opacity-60">
              Alt: {novel.alt_titles.join(" · ")}
            </p>
          )}
          {novel.author && (
            <p className="text-sm">
              <span className="opacity-60">oleh </span>
              <span className="font-medium">{novel.author}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {novel.genres.map((g) => (
              <Link
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                className="text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:bg-accent hover:text-white transition"
              >
                {g}
              </Link>
            ))}
          </div>
          <p className="text-sm opacity-90 leading-relaxed whitespace-pre-line">
            {novel.description}
          </p>
          <div className="flex items-center gap-3 text-xs opacity-70">
            <span>📚 {chapters.length} chapter</span>
            <span>✍️ {totalWords.toLocaleString("id-ID")} kata</span>
            {novel.rating && <span>⭐ {novel.rating.toFixed(1)}</span>}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {firstChapter && (
              <Link
                href={`/read/${novel.slug}/${firstChapter.number}`}
                className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90"
              >
                📖 Mulai dari Ch 1
              </Link>
            )}
            {lastChapter && (
              <Link
                href={`/read/${novel.slug}/${lastChapter.number}`}
                className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20"
              >
                ⏭ Chapter Terakhir
              </Link>
            )}
            <BookmarkButton novel={novel} />
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg sm:text-xl font-bold">Daftar Chapter</h2>
          <span className="text-xs opacity-60">{chapters.length} entries</span>
        </div>
        <div className="rounded-xl overflow-hidden bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5">
          <ChapterList novel={novel} chapters={chapters.slice().reverse()} />
        </div>
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
  );
}
