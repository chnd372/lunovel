"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom navigation — mobile only. Rendered in app/layout.tsx after the
// page content so it can sit position:fixed without disturbing stacking.
// Active route is detected from pathname; the "Baca" tab links to /profile
// (where last-read chapter lives in the history list) when no other match.
const ITEMS = [
  { href: "/", label: "Beranda", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  ), match: (p: string) => p === "/" },
  { href: "/search", label: "Cari", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
  ), match: (p: string) => p.startsWith("/search") },
  { href: "/novel", label: "Novel", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
  ), match: (p: string) => p.startsWith("/novel") || p.startsWith("/read") },
  { href: "/profile", label: "Profil", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ), match: (p: string) => p.startsWith("/profile") },
];

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 glass flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_30px_rgba(0,0,0,0.05)] transition-colors duration-300"
    >
      {ITEMS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] active:scale-95 transition-all duration-300 ${
              active
                ? "text-accent font-semibold"
                : "text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white"
            }`}
          >
            <div className={`${active ? "scale-110" : "scale-100"} transition-transform duration-300`}>
              {item.icon}
            </div>
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
      <Link
        href={lastRead}
        aria-label="Lanjut baca"
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] active:scale-95 transition-all duration-300 ${
          pathname.startsWith("/read")
            ? "text-accent font-semibold"
            : "text-black/55 dark:text-white/55 hover:text-black dark:hover:text-white"
        }`}
      >
        <div className={`${pathname.startsWith("/read") ? "scale-110" : "scale-100"} transition-transform duration-300`}>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        </div>
        <span className="leading-none">Baca</span>
      </Link>
    </nav>
  );
}
