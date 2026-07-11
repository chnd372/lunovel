import Link from "next/link";
import NovelCard from "./NovelCard";
import type { Novel } from "@/lib/types";

interface Props {
  results: Novel[];
  genres: string[];
  searchParams: Record<string, string | undefined>;
  totalLabel?: string;
  q?: string;
  /** URL base for filter chip links. Defaults to "/search". */
  basePath?: string;
}

/** Reusable novel listing grid + filter chips. Used by /search and /novel.
 *  ponytail: extract to <FilterChips> + <Grid> subcomponents when the
 *  filter row exceeds ~120 lines or another consumer wants partial slices. */
export default function NovelList({
  results,
  genres,
  searchParams,
  totalLabel,
  q,
  basePath = "/search",
}: Props) {
  const { genre, status, type } = searchParams;
  const showEmpty = results.length === 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs opacity-60 mr-1 self-center">Status:</span>
          <FilterChip
            href={`${basePath}?${new URLSearchParams({ ...searchParams, status: "" } as any).toString()}`}
            active={!status}
          >
            Semua
          </FilterChip>
          {(["ongoing", "completed", "hiatus"] as const).map((s) => (
            <FilterChip
              key={s}
              href={`${basePath}?${new URLSearchParams({ ...searchParams, status: s } as any).toString()}`}
              active={status === s}
            >
              {s === "ongoing" ? "Ongoing" : s === "completed" ? "Tamat" : "Hiatus"}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs opacity-60 mr-1 self-center">Tipe:</span>
          <FilterChip href={`${basePath}?${new URLSearchParams({ ...searchParams, type: "" } as any).toString()}`} active={!type}>
            Semua
          </FilterChip>
          {(["translated", "original"] as const).map((t) => (
            <FilterChip
              key={t}
              href={`${basePath}?${new URLSearchParams({ ...searchParams, type: t } as any).toString()}`}
              active={type === t}
            >
              {t === "translated" ? "Terjemahan" : "Original"}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs opacity-60 mr-1 self-center">Genre:</span>
          <FilterChip href={`${basePath}?${new URLSearchParams({ ...searchParams, genre: "" } as any).toString()}`} active={!genre}>
            Semua
          </FilterChip>
          {genres.map((g) => (
            <FilterChip
              key={g}
              href={`${basePath}?${new URLSearchParams({ ...searchParams, genre: g } as any).toString()}`}
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
          {totalLabel ?? `${results.length} hasil`}
          {q && <span className="opacity-60"> untuk "{q}"</span>}
        </h2>
        {showEmpty ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="opacity-70">
              Gak ada novel yang cocok. Coba kata kunci lain.
            </p>
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
