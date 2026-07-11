import type { Metadata } from "next";
import { searchNovels, allGenres, getAllNovels } from "@/lib/data";
import NovelList from "@/components/NovelList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; genre?: string; status?: string; type?: string };
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";

export function generateMetadata({ searchParams }: Props): Metadata {
  const { genre, status, type } = searchParams;
  const parts: string[] = [];
  if (genre) parts.push(genre);
  if (status) parts.push(status === "ongoing" ? "Ongoing" : status === "completed" ? "Completed" : status);
  if (type) parts.push(type === "translated" ? "Terjemahan" : "Original");
  const label = parts.length > 0 ? parts.join(" · ") : "Semua Novel";
  return {
    title: `Daftar Novel${label !== "Semua Novel" ? ` · ${label}` : ""}`,
    description: `Daftar lengkap novel${genre ? ` genre ${genre}` : ""}${status ? ` status ${status}` : ""} di ${SITE_NAME}. Baca online gratis.`,
    alternates: { canonical: "/novel" },
  };
}

export default async function NovelIndexPage({ searchParams }: Props) {
  const { genre, status, type } = searchParams;
  const all = await getAllNovels();
  const genres = allGenres(all);
  const results = await searchNovels("", { genre, status, type });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">📚 Daftar Novel</h1>
        <span className="text-xs opacity-60">
          {results.length} novel
        </span>
      </header>

      <NovelList
        results={results}
        genres={genres}
        searchParams={searchParams as Record<string, string | undefined>}
        basePath="/novel"
      />
    </div>
  );
}
