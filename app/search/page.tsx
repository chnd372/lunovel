import { searchNovels, allGenres, getAllNovels } from "@/lib/data";
import NovelCard from "@/components/NovelCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { q?: string; genre?: string; status?: string; type?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", genre, status, type } = searchParams;
  const all = await getAllNovels();
  const genres = allGenres(all);
  const results = await searchNovels(q, { genre, status, type });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Search bar */}
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

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs opacity-60 mr-1 self-center">Status:</span>
          <FilterChip href={`/search?${new URLSearchParams({ ...searchParams, status: "" } as any).toString()}`} active={!status}>
            Semua
          </FilterChip>
          {(["ongoing", "completed", "hiatus"] as const).map((s) => (
            <FilterChip
              key={s}
              href={`/search?${new URLSearchParams({ ...searchParams, status: s } as any).toString()}`}
              active={status === s}
            >
              {s === "ongoing" ? "Ongoing" : s === "completed" ? "Tamat" : "Hiatus"}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs opacity-60 mr-1 self-center">Tipe:</span>
          <FilterChip href={`/search?${new URLSearchParams({ ...searchParams, type: "" } as any).toString()}`} active={!type}>
            Semua
          </FilterChip>
          {(["translated", "original"] as const).map((t) => (
            <FilterChip
              key={t}
              href={`/search?${new URLSearchParams({ ...searchParams, type: t } as any).toString()}`}
              active={type === t}
            >
              {t === "translated" ? "Terjemahan" : "Original"}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs opacity-60 mr-1 self-center">Genre:</span>
          <FilterChip href={`/search?${new URLSearchParams({ ...searchParams, genre: "" } as any).toString()}`} active={!genre}>
            Semua
          </FilterChip>
          {genres.map((g) => (
            <FilterChip
              key={g}
              href={`/search?${new URLSearchParams({ ...searchParams, genre: g } as any).toString()}`}
              active={genre === g}
            >
              {g}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-lg font-bold mb-3">
          {results.length} hasil {q && <span className="opacity-60">untuk "{q}"</span>}
        </h2>
        {results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="opacity-70">Gak ada novel yang cocok. Coba kata kunci lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {results.map((n) => (
              <NovelCard key={n.id} novel={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-2.5 py-1 rounded-full transition ${
        active
          ? "bg-accent text-white"
          : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
      }`}
    >
      {children}
    </Link>
  );
}
