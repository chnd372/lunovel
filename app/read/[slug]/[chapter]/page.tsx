import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getNovelBySlug, getChaptersByNovel, getChapter } from "@/lib/data";
import Reader from "@/components/Reader";
import ErrorBoundary from "@/components/ErrorBoundary";

export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string; chapter: string };
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const novel = await getNovelBySlug(params.slug);
  if (!novel) return { title: "Chapter tidak ditemukan" };

  const chapterNumber = Number(params.chapter);
  if (Number.isNaN(chapterNumber)) return { title: "Chapter tidak valid" };

  const chapter = await getChapter(novel.id, chapterNumber);
  if (!chapter) return { title: "Chapter tidak ditemukan" };

  const chLabel = chapter.title ? `Ch ${chapter.number}: ${chapter.title}` : `Chapter ${chapter.number}`;
  const title = `${chLabel} - ${novel.title} | ${SITE_NAME}`;
  const description = `Baca ${novel.title} Chapter ${chapter.number}${chapter.title ? ` - ${chapter.title}` : ""} dalam bahasa Indonesia. Online, gratis, tanpa iklan di ${SITE_NAME}.`;
  const ogImage = novel.cover
    ? [{ url: novel.cover, width: 800, height: 1200, alt: `${novel.title} — ${chLabel}` }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/read/${novel.slug}/${chapter.number}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/read/${novel.slug}/${chapter.number}`,
      siteName: SITE_NAME,
      locale: "id_ID",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage?.map((i) => i.url),
    },
    robots: { index: true, follow: true },
  };
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
    <ErrorBoundary>
      <Reader
        novel={novel}
        chapter={chapter}
        prevChapter={prev ? { number: prev.number } : null}
        nextChapter={next ? { number: next.number } : null}
      />
    </ErrorBoundary>
  );
}
