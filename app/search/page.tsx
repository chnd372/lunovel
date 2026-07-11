import type { Metadata } from "next";
import { searchNovels, allGenres, getAllNovels } from "@/lib/data";
import NovelList from "@/components/NovelList";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; genre?: string; status?: string; type?: string };
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";

export function generateMetadata({ searchParams }: Props): Metadata {
  const { q, genre, status, type } = searchParams;
  const parts: string[] = [];
  if (q) parts.push(`"${q}"`);
  if (genre) parts.push(genre);
  if (status) parts.push(status === "ongoing" ? "Ongoing" : status === "completed" ? "Completed" : status);
  if (type) parts.push(type === "translated" ? "Terjemahan" : "Original");
  const label = parts.length > 0 ? parts.join(" · ") : "Semua Novel";
  const title = parts.length > 0 ? `Cari: ${label}` : `Cari Novel`;
  return {
    title,
    description: `Cari novel${q ? ` "${q}"` : ""}${genre ? ` genre ${genre}` : ""}${status ? ` status ${status}` : ""}${type ? ` ${type === "translated" ? "terjemahan" : "original"}` : ""}. Ribuan chapter siap dibaca online gratis di ${SITE_NAME}.`,
    alternates: { canonical: "/search" },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", genre, status, type } = searchParams;
  const all = await getAllNovels();
  const genres = allGenres(all);
  const results = await searchNovels(q, { genre, status, type });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Search bar — submits to /search so URL stays canonical for the
          query, while filter chips reuse the same component for /novel. */}
      <form action="/search" method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari novel, penulis, deskripsi..."
          className="flex-1 px-4 py-2 rounded-lg bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90"
        >
          Cari
        </button>
      </form>

      <NovelList
        results={results}
        genres={genres}
        searchParams={searchParams as Record<string, string | undefined>}
        totalLabel={`${results.length} hasil`}
        q={q}
        basePath="/search"
      />
    </div>
  );
}
