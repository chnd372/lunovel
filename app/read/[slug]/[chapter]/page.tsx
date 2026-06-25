import { notFound } from "next/navigation";
import { getNovelBySlug, getChaptersByNovel, getChapter } from "@/lib/data";
import Reader from "@/components/Reader";
import CorrectionPanel from "@/components/CorrectionPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string; chapter: string };
}

export default async function ReadPage({ params }: Props) {
  const novel = await getNovelBySlug(params.slug);
  if (!novel) notFound();

  const chapterNumber = Number(params.chapter);
  if (Number.isNaN(chapterNumber)) notFound();

  const chapter = await getChapter(novel.id, chapterNumber);
  if (!chapter) notFound();

  // Pre-fetch prev/next
  const allChapters = await getChaptersByNovel(novel.id);
  const currentIdx = allChapters.findIndex((c) => c.number === chapterNumber);
  const prev = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const next = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  return (
    <>
      <Reader
        novel={novel}
        chapter={chapter}
        prevChapter={prev ? { number: prev.number } : null}
        nextChapter={next ? { number: next.number } : null}
      />
      {/* Floating correction panel (bottom-left) */}
      <div className="fixed bottom-6 left-6 z-30 max-w-sm">
        <CorrectionPanel novelId={novel.id} novelSlug={novel.slug} />
      </div>
    </>
  );
}
