"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";

export function ThemeScript() {
  // No-flash theme detection — runs before React hydrates
  const code = `
    (function() {
      try {
        var t = localStorage.getItem('theme');
        if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

// Mobile nav items — icons + href, rendered identically inside the
// desktop <nav> and the mobile drawer so behaviour stays in sync.
type NavItem = { href: string; label: string; icon: string; match: (p: string) => boolean };
const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Beranda", icon: "🏠", match: (p) => p === "/" },
  { href: "/search?type=translated", label: "Terjemahan", icon: "📖", match: () => false },
  { href: "/search?type=original", label: "Original", icon: "✍️", match: () => false },
  { href: "/search?status=ongoing", label: "Ongoing", icon: "🔄", match: () => false },
  { href: "/search?status=completed", label: "Completed", icon: "✅", match: () => false },
  { href: "/profile", label: "Profil", icon: "👤", match: (p) => p.startsWith("/profile") },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Close drawer on route change so the user lands on the new page cleanly
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Body scroll lock + ESC-to-close while the drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) {
      setSearchOpen(false);
      setMobileOpen(false);
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur border-b border-black/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg sm:text-xl font-bold text-accent shrink-0 flex items-center gap-1.5 sm:gap-2"
        >
          <span className="text-2xl">🌙</span>
          <span className="font-serif tracking-tight">{siteName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          {NAV_ITEMS.map((item) => {
            const active = item.match ? item.match(pathname) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 ${
                  active ? "font-semibold text-accent" : "opacity-70 hover:opacity-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop search (inline) */}
        <form onSubmit={onSearch} className="hidden md:flex flex-1 max-w-md ml-auto">
          <input
            type="search"
            placeholder="Cari novel, penulis, genre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>

        {/* Mobile right cluster: search toggle, theme, hamburger */}
        <div className="ml-auto flex items-center gap-1 md:gap-2 md:ml-0">
          {/* Mobile: search toggle (icon only when collapsed, full bar when expanded) */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Tutup pencarian" : "Buka pencarian"}
            aria-expanded={searchOpen}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0 text-lg"
          >
            {searchOpen ? "✕" : "🔍"}
          </button>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0 text-lg"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0 text-lg"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile expanded search bar — full width, slides down under header */}
      <div
        className={`md:hidden overflow-hidden border-t border-black/5 dark:border-white/5 transition-[max-height,opacity] duration-200 ease-out ${
          searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!searchOpen}
      >
        <form onSubmit={onSearch} className="px-3 py-2 bg-bg-light/95 dark:bg-bg-dark/95">
          <input
            type="search"
            autoFocus={searchOpen}
            placeholder="Cari novel, penulis, genre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <button
          aria-label="Tutup menu"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className={`absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-bg-light dark:bg-bg-dark border-l border-black/10 dark:border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-black/10 dark:border-white/10 shrink-0">
            <span className="font-bold text-accent flex items-center gap-2">
              <span>🌙</span>
              <span className="font-serif">{siteName}</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="p-2 -mr-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Drawer nav — tap targets ≥44px per Apple HIG */}
          <nav className="flex-1 overflow-y-auto py-2">
            {NAV_ITEMS.map((item) => {
              const active = item.match ? item.match(pathname) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 min-h-[48px] text-base transition-colors ${
                    active
                      ? "bg-accent/10 text-accent font-semibold border-l-4 border-accent"
                      : "hover:bg-black/5 dark:hover:bg-white/5 border-l-4 border-transparent active:bg-black/10 dark:active:bg-white/10"
                  }`}
                >
                  <span className="text-2xl w-8 text-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer footer: theme toggle */}
          <div className="border-t border-black/10 dark:border-white/10 px-4 py-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 min-h-[48px] px-2 -mx-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-2xl w-8 text-center">{theme === "dark" ? "☀️" : "🌙"}</span>
              <span className="text-base">{theme === "dark" ? "Mode Terang" : "Mode Gelap"}</span>
            </button>
            <p className="mt-2 text-xs opacity-50">Tekan ESC atau tap di luar untuk tutup</p>
          </div>
        </aside>
      </div>
    </header>
  );
}
