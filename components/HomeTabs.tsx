"use client";

import { useState } from "react";
import Link from "next/link";
import NovelCard from "./NovelCard";
import type { Novel } from "@/lib/types";

interface EnrichedNovel {
  novel: Novel;
  chapterCount: number;
  totalWords: number;
}

interface Props {
  enriched: EnrichedNovel[];
}

type TabId = "all" | "xianxia" | "fantasy" | "romance" | "action" | "mystery";

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "all", label: "Semua", icon: "📚" },
  { id: "xianxia", label: "Xianxia", icon: "🐉" },
  { id: "fantasy", label: "Fantasi", icon: "🧙" },
  { id: "action", label: "Action", icon: "⚔️" },
  { id: "romance", label: "Romance", icon: "❤️" },
  { id: "mystery", label: "Misteri", icon: "🔍" },
];

/** Check if a novel matches a genre-based tab */
function matchesTab(novel: Novel, tab: TabId): boolean {
  if (tab === "all") return true;
  const genreMap: Record<TabId, string[]> = {
    all: [],
    xianxia: ["xianxia", "cultivation"],
    fantasy: ["fantasy", "magic", "adventure"],
    action: ["action", "fight", "martial arts", "wuxia"],
    romance: ["romance", "drama", "slice of life"],
    mystery: ["mystery", "detektif", "fiksi kriminal", "crime"],
  };
  const targets = genreMap[tab];
  const novelGenres = novel.genres.map((g) => g.toLowerCase());
  return targets.some((t) => novelGenres.includes(t));
}

export default function HomeTabs({ enriched }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered =
    activeTab === "all"
      ? enriched
      : enriched.filter((e) => matchesTab(e.novel, activeTab));

  return (
    <section className="space-y-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-accent text-white shadow-sm"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        {/* View toggle — pushed to right */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-accent/20 text-accent"
                : "opacity-40 hover:opacity-80"
            }`}
            aria-label="Grid view"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
              <rect x="11" y="1" width="6" height="6" rx="1" fill="currentColor" />
              <rect x="1" y="11" width="6" height="6" rx="1" fill="currentColor" />
              <rect x="11" y="11" width="6" height="6" rx="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-accent/20 text-accent"
                : "opacity-40 hover:opacity-80"
            }`}
            aria-label="List view"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="16" height="3" rx="1" fill="currentColor" />
              <rect x="1" y="7.5" width="16" height="3" rx="1" fill="currentColor" />
              <rect x="1" y="14" width="16" height="3" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg sm:text-xl font-bold">
          {activeTab === "all"
            ? "Update Terbaru"
            : `${tabs.find((t) => t.id === activeTab)?.label}`}
        </h2>
        <span className="text-xs opacity-60">{filtered.length} novel</span>
      </div>

      {/* Cards */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map(({ novel, chapterCount }) => (
            <NovelCard key={novel.id} novel={novel} chapterCount={chapterCount} />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(({ novel, chapterCount }) => (
            <Link
              key={novel.id}
              href={`/novel/${novel.slug}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 hover:bg-accent/5 transition-colors group"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
                {novel.cover ? "📖" : "📖"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm line-clamp-1 group-hover:text-accent transition-colors">
                  {novel.title}
                </div>
                <div className="flex items-center gap-2 text-[11px] opacity-60">
                  {novel.author && <span>{novel.author}</span>}
                  {novel.genres.length > 0 && <span>·</span>}
                  <span className="line-clamp-1">
                    {novel.genres.slice(0, 2).join(" · ")}
                  </span>
                </div>
              </div>
              <div className="text-xs opacity-50 shrink-0">
                {chapterCount} ch
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length > 12 && (
        <div className="text-center pt-2">
          <Link
            href={`/search?genre=${activeTab !== "all" ? activeTab : ""}`}
            className="inline-block px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/20 transition"
          >
            Lihat semua {filtered.length} novel →
          </Link>
        </div>
      )}
    </section>
  );
}
