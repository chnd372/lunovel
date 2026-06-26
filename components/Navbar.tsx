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

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [q, setQ] = useState("");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur border-b border-black/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-accent shrink-0 flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <span className="font-serif tracking-tight">{siteName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/" className={pathname === "/" ? "font-semibold" : "opacity-70 hover:opacity-100"}>Beranda</Link>
          <Link href="/search?type=translated" className="opacity-70 hover:opacity-100">Terjemahan</Link>
          <Link href="/search?type=original" className="opacity-70 hover:opacity-100">Original</Link>
          <Link href="/search?status=ongoing" className="opacity-70 hover:opacity-100">Ongoing</Link>
          <Link href="/search?status=completed" className="opacity-70 hover:opacity-100">Completed</Link>
          <Link href="/profile" className={`flex items-center gap-1.5 opacity-70 hover:opacity-100 ${pathname === "/profile" ? "text-accent" : ""}`}>
            👤
          </Link>
        </nav>
        <form onSubmit={onSearch} className="flex-1 max-w-md ml-auto">
          <input
            type="search"
            placeholder="Cari novel, penulis, genre..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}
