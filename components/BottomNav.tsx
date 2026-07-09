"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom navigation — mobile only. Rendered in app/layout.tsx after the
// page content so it can sit position:fixed without disturbing stacking.
// Active route is detected from pathname; the "Baca" tab links to /profile
// (where last-read chapter lives in the history list) when no other match.
const ITEMS = [
  { href: "/", label: "Beranda", icon: "🏠", match: (p: string) => p === "/" },
  { href: "/search", label: "Cari", icon: "🔍", match: (p: string) => p.startsWith("/search") },
  { href: "/novel", label: "Novel", icon: "📚", match: (p: string) => p.startsWith("/novel") || p.startsWith("/read") },
  { href: "/profile", label: "Profil", icon: "👤", match: (p: string) => p.startsWith("/profile") },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const [lastRead, setLastRead] = useState<string>("/profile");

  // Pull last-read href from localStorage history; falls back to /profile
  // so the tab is always navigable.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lunovel_history");
      if (!raw) return;
      const hist = JSON.parse(raw) as Array<{
        novel_slug?: string;
        chapter_number?: number;
        read_at?: string;
      }>;
      const withSlug = hist.filter(
        (h): h is { novel_slug: string; chapter_number: number; read_at?: string } =>
          Boolean(h.novel_slug && h.chapter_number),
      );
      const latest = withSlug.sort((a, b) =>
        (b.read_at ?? "").localeCompare(a.read_at ?? ""),
      )[0];
      if (latest) {
        setLastRead(`/read/${latest.novel_slug}/${latest.chapter_number}`);
      }
    } catch {
      // localStorage may be disabled — keep default
    }
  }, []);

  // The "Baca" item is dynamic — we render it separately so its href can
  // differ from the rest of the nav array.
  return (
    <nav
      data-bottom-nav
      aria-label="Navigasi bawah"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-bg-light dark:bg-bg-dark border-t border-black/10 dark:border-white/10 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]"
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              active
                ? "text-accent font-semibold"
                : "text-black/55 dark:text-white/55 hover:text-accent"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
      <Link
        href={lastRead}
        aria-label="Lanjut baca"
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
          pathname.startsWith("/read")
            ? "text-accent font-semibold"
            : "text-black/55 dark:text-white/55 hover:text-accent"
        }`}
      >
        <span className="text-xl leading-none">📖</span>
        <span className="leading-none">Baca</span>
      </Link>
    </nav>
  );
}
