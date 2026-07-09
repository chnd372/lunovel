"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import type { ReaderSettings, Chapter, Novel, ReaderTheme } from "@/lib/types";
import { estimateReadingMinutes } from "@/lib/data";
import { applyCorrections, getCorrections } from "@/lib/corrections";
import { applyPerbaikan, syncSharedRules } from "@/lib/perbaikanKata";
import TextSelectionHandler from "@/components/TextSelectionHandler";
import Comments from "@/components/Comments";
import { useRouter } from "next/navigation";

interface Props {
  novel: Novel;
  chapter: Chapter;
  prevChapter: { number: number } | null;
  nextChapter: { number: number } | null;
}

const SETTINGS_KEY = "lunovel_reader_settings";
const HISTORY_KEY = "lunovel_history";

const defaultSettings: ReaderSettings = {
  theme: "light",
  font_size: 18,
  line_height: 1.8,
  max_width: 720,
  font_family: "serif",
};

const themes: Record<ReaderTheme, { bg: string; text: string; label: string; icon: string }> = {
  light: { bg: "bg-[#fafaf8]", text: "text-[#1a1a1a]", label: "Light", icon: "☀️" },
  sepia: { bg: "bg-[#f4ecd8]", text: "text-[#5b4636]", label: "Sepia", icon: "📜" },
  dark:  { bg: "bg-[#0d0d0d]", text: "text-[#e8e8e8]", label: "Dark",  icon: "🌙" },
};

function loadSettings(): ReaderSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { return defaultSettings; }
}

function saveSettings(s: ReaderSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

function saveHistory(novelId: string, chapterId: string, chapterNumber: number, percent: number) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((h: any) => h.novel_id !== novelId);
    filtered.unshift({
      novel_id: novelId,
      chapter_id: chapterId,
      chapter_number: chapterNumber,
      scroll_percent: Math.round(percent),
      read_at: new Date().toISOString(),
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch {}
}

export default function Reader({ novel, chapter, prevChapter, nextChapter }: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [perbaikanVersion, setPerbaikanVersion] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Apply approved corrections to chapter content
  const { text: correctedContent, applied: appliedCorrections } = applyCorrections(chapter.content, novel.id);
  // Apply personal find/replace rules (per-novel localStorage).
  // perbaikanVersion bump forces re-apply after user adds a new rule via modal.
  const { text: chapterContent } = useMemo(
    () => applyPerbaikan(correctedContent, novel.slug),
    [correctedContent, novel.slug, perbaikanVersion],
  );

  // Listen for perbaikan changes (new rule added via TextSelectionHandler modal)
  useEffect(() => {
    function onChange(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.slug === novel.slug) {
        setPerbaikanVersion((v: number) => v + 1);
      }
    }
    window.addEventListener("lunovel:perbaikan-changed", onChange);
    return () => window.removeEventListener("lunovel:perbaikan-changed", onChange);
  }, [novel.slug]);

  // Fetch shared find/replace rules from API on mount (KV authoritative, local cache fallback)
  useEffect(() => {
    const ac = new AbortController();
    syncSharedRules(novel.slug, ac.signal)
      .then(() => setPerbaikanVersion((v: number) => v + 1))
      .catch(() => {});
    return () => ac.abort();
  }, [novel.slug]);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Persist settings on change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Track scroll progress
  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
      // Save history when past 30%
      if (pct > 30) {
        saveHistory(novel.id, chapter.id, chapter.number, pct);
      }
      setShowHeader(scrollTop < 100);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [novel.id, chapter.id, chapter.number]);

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && prevChapter) {
        router.push(`/read/${novel.slug}/${prevChapter.number}`);
      } else if (e.key === "ArrowRight" && nextChapter) {
        router.push(`/read/${novel.slug}/${nextChapter.number}`);
      } else if (e.key === "Escape") {
        router.push(`/novel/${novel.slug}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, novel.slug, prevChapter, nextChapter]);

  const theme = themes[settings.theme];
  const minutes = estimateReadingMinutes(chapter.word_count);
        const paragraphs = chapterContent.split(/\n\n+/);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      {/* Hide the site Navbar when in reader — we manage our own header */}
      <style dangerouslySetInnerHTML={{ __html: `header.sticky { display: none !important; }` }} />
      
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-50">
        <div
          className="h-full bg-accent transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navbar placeholder — hidden in reader, controlled by Reader component */}

      {/* Floating header (hides on scroll) */}
      <header
        className={`fixed top-1 left-0 right-0 z-40 transition-all duration-300 ${
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/novel/${novel.slug}`)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Back to novel"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-xs opacity-60 line-clamp-1">{novel.title}</div>
            <div className="font-semibold text-sm line-clamp-1">
              Ch {chapter.number}: {chapter.title || "—"}
            </div>
          </div>
        </div>
      </header>

      {/* Settings FAB — auto-hide when scrolling deep */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          progress > 15 ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100"
        }`}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 rounded-full bg-accent text-white shadow-lg hover:scale-105 transition-transform"
          aria-label="Reader settings"
        >
          ⚙
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
          onClick={() => setShowSettings(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-md bg-white dark:bg-neutral-900 rounded-t-2xl md:rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Pengaturan Bacaan</h3>
              <button onClick={() => setShowSettings(false)} className="text-2xl">×</button>
            </div>

            {/* Theme */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-2">Tema</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(themes) as ReaderTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSettings({ ...settings, theme: t })}
                    className={`p-2 rounded-lg border-2 ${
                      settings.theme === t
                        ? "border-accent bg-accent/10"
                        : "border-black/10 dark:border-white/10"
                    }`}
                  >
                    <div className="text-xl">{themes[t].icon}</div>
                    <div className="text-xs font-medium">{themes[t].label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-2">
                Ukuran Font: {settings.font_size}px
              </label>
              <input
                type="range"
                min="14"
                max="28"
                value={settings.font_size}
                onChange={(e) => setSettings({ ...settings, font_size: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            {/* Line height */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-2">
                Spasi Baris: {settings.line_height.toFixed(1)}
              </label>
              <input
                type="range"
                min="1.3"
                max="2.4"
                step="0.1"
                value={settings.line_height}
                onChange={(e) => setSettings({ ...settings, line_height: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            {/* Max width */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-2">
                Lebar: {settings.max_width}px
              </label>
              <input
                type="range"
                min="500"
                max="1000"
                step="20"
                value={settings.max_width}
                onChange={(e) => setSettings({ ...settings, max_width: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            {/* Font family */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-2">Font</label>
              <div className="grid grid-cols-3 gap-2">
                {(["serif", "sans", "mono"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSettings({ ...settings, font_family: f })}
                    className={`p-2 rounded-lg border-2 text-sm ${
                      settings.font_family === f
                        ? "border-accent bg-accent/10"
                        : "border-black/10 dark:border-white/10"
                    } ${
                      f === "serif" ? "font-serif" : f === "sans" ? "font-sans" : "font-mono"
                    }`}
                  >
                    Aa
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSettings(defaultSettings)}
              className="w-full py-2 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium"
            >
              Reset ke Default
            </button>
          </div>
        </div>
      )}

      {/* Text selection handler for corrections */}
      <TextSelectionHandler
        novelId={novel.id}
        novelSlug={novel.slug}
        chapterId={chapter.id}
        chapterNumber={chapter.number}
        contentRef={contentRef}
      />

      {/* Article */}
      <article
        ref={contentRef}
        className="mx-auto px-4 md:px-6 pt-16 pb-32"
        style={{ maxWidth: settings.max_width + 32 }}
      >
        <header className="mb-8 pb-6 border-b border-current/10">
          <div className="text-xs uppercase tracking-wider opacity-50 mb-1">
            Chapter {chapter.number}
          </div>
          <h1
            className={`font-bold mb-2 ${
              settings.font_family === "serif" ? "font-serif" : settings.font_family === "sans" ? "font-sans" : "font-mono"
            }`}
            style={{ fontSize: settings.font_size * 1.8, lineHeight: 1.2 }}
          >
            {chapter.title || `Chapter ${chapter.number}`}
          </h1>
          <div className="text-xs opacity-60 flex items-center gap-3 flex-wrap">
            <span>{chapter.word_count.toLocaleString("id-ID")} kata</span>
            <span>·</span>
            <span>~{minutes} menit baca</span>
            <span>·</span>
            <span>{progress.toFixed(0)}% selesai</span>
          </div>
        </header>

        <div
          className={`${settings.font_family === "serif" ? "font-serif" : settings.font_family === "sans" ? "font-sans" : "font-mono"}`}
          style={{
            fontSize: settings.font_size,
            lineHeight: settings.line_height,
          }}
        >
          {paragraphs.map((p, i) => {
            // Apply inline highlighting for pending/approved corrections
            const pendingCorrs = typeof window !== "undefined" ? getCorrections(novel.id, "pending") : [];
            const approvedCorrs = typeof window !== "undefined" ? getCorrections(novel.id, "approved") : [];
            const allCorrs = [...pendingCorrs, ...approvedCorrs];
            
            // Simple approach: highlight original text that has pending corrections
            let rendered = p;
            for (const corr of pendingCorrs) {
              if (rendered.includes(corr.original)) {
                rendered = rendered.replace(
                  corr.original,
                  `<mark class="bg-amber-200/50 dark:bg-amber-500/20 border-b-2 border-dashed border-amber-400" title="Saran: ${corr.suggested}">${corr.original}</mark>`
                );
              }
            }
            
            return (
              <p
                key={i}
                className="mb-6 indent-8 first:indent-0"
                style={{ textAlign: "justify", hyphens: "auto" }}
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            );
          })}
        </div>

        {/* End of chapter */}
        <div className="mt-16 pt-8 border-t border-current/10 text-center">
          <div className="text-3xl mb-4 opacity-30">⁂</div>
          <p className="text-sm opacity-60 mb-6">Akhir Chapter {chapter.number}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {prevChapter ? (
              <button
                onClick={() => router.push(`/read/${novel.slug}/${prevChapter.number}`)}
                className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-sm font-medium"
              >
                ← Chapter {prevChapter.number}
              </button>
            ) : (
              <span className="px-4 py-2 text-sm opacity-40">Chapter pertama</span>
            )}
            <button
              onClick={() => router.push(`/novel/${novel.slug}`)}
              className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-sm font-medium"
            >
              📋 Daftar Chapter
            </button>
            {nextChapter ? (
              <button
                onClick={() => router.push(`/read/${novel.slug}/${nextChapter.number}`)}
                className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 text-sm font-medium"
              >
                Chapter {nextChapter.number} →
              </button>
            ) : (
              <span className="px-4 py-2 text-sm opacity-40">Chapter terakhir 🎉</span>
            )}
          </div>
        </div>
      </article>

      {/* Comments thread — WordPress-inspired, threaded replies */}
      <Comments
        chapterId={chapter.id}
        novelId={novel.id}
      />
    </div>
  );
}
