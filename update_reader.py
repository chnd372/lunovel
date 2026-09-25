import re

with open("components/Reader.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update themes
old_themes = re.search(r"const themes: Record.*?};", content, re.S)
if old_themes:
    new_themes = """const themes: Record<ReaderTheme, { bg: string; text: string; label: string; icon: string }> = {
  light: { bg: "bg-[#fcfcfa]", text: "text-[#111111]", label: "Light", icon: "☀️" },
  sepia: { bg: "bg-[#f5ead5]", text: "text-[#433422]", label: "Sepia", icon: "📜" },
  slate: { bg: "bg-[#0f172a]", text: "text-[#cbd5e1]", label: "Slate", icon: "🌑" },
  dark:  { bg: "bg-[#000000]", text: "text-[#e2e8f0]", label: "OLED",  icon: "🌙" },
};"""
    content = content.replace(old_themes.group(0), new_themes)

# Fix type `ReaderTheme` in types.ts
# It's defined elsewhere. Let's assume ReaderTheme is a string literal union, we better not change the keys if we can't edit types.ts safely, or we can just patch types.ts.
# Let's check lib/types.ts later. For now, keep the keys 'light', 'sepia', 'dark', 'cyan' but change labels!
new_themes_safe = """const themes: Record<ReaderTheme, { bg: string; text: string; label: string; icon: string }> = {
  light: { bg: "bg-[#fcfcfa]", text: "text-[#111111]", label: "Light", icon: "☀️" },
  sepia: { bg: "bg-[#f5ead5]", text: "text-[#433422]", label: "Sepia", icon: "📜" },
  cyan: { bg: "bg-[#0f172a]", text: "text-[#cbd5e1]", label: "Slate", icon: "🌑" },
  dark:  { bg: "bg-[#000000]", text: "text-[#e2e8f0]", label: "OLED",  icon: "🌙" },
};"""
if old_themes:
    content = content.replace(new_themes, new_themes_safe) # in case we already replaced it in memory
    content = content.replace(old_themes.group(0), new_themes_safe)


# 2. Update scroll logic for showHeader
old_scroll = """      // Save history when past 20%
      if (pct > 20) {
        saveHistory(
          novel.id,
          novel.slug,
          novel.title,
          chapter.id,
          chapter.number,
          chapter.title || `Chapter ${chapter.number}`,
          pct,
        );
      }
      setShowHeader(scrollTop < 100);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [novel.id, chapter.id, chapter.number]);"""

new_scroll = """      // Save history when past 20%
      if (pct > 20) {
        saveHistory(
          novel.id,
          novel.slug,
          novel.title,
          chapter.id,
          chapter.number,
          chapter.title || `Chapter ${chapter.number}`,
          pct,
        );
      }
      
      if (scrollTop < 50) {
        setShowHeader(true);
      } else if (scrollTop > lastScrollY.current && scrollTop > 100) {
        setShowHeader(false);
      } else if (scrollTop < lastScrollY.current) {
        setShowHeader(true);
      }
      lastScrollY.current = scrollTop;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [novel.id, chapter.id, chapter.number, novel.slug, novel.title]);"""

# we need to inject lastScrollY useRef
if "const [showHeader, setShowHeader] = useState(true);" in content:
    content = content.replace("const [showHeader, setShowHeader] = useState(true);", "const [showHeader, setShowHeader] = useState(true);\n  const lastScrollY = useRef(0);")

content = content.replace(old_scroll, new_scroll)


# 3. Make header glassmorphic
old_header = """<header
        className={`fixed top-1 left-0 right-0 z-40 transition-all duration-300 ${
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">"""

new_header = """<header
        className={`fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 transition-transform duration-500 ease-in-out ${
          showHeader ? "translate-y-0" : "-translate-y-full pointer-events-none"
        }`}
      >
        <div className="max-w-[75ch] mx-auto px-4 py-3 flex items-center gap-3 pt-4">"""

content = content.replace(old_header, new_header)

# 4. Limit content width to 65-75ch
# There's a max_width setting, we can just ensure the container defaults or max-width uses `ch` nicely.
# Actually, the user setting `max_width` directly controls it:
# `style={{ maxWidth: settings.max_width + 32 }}`
# We can change defaultSettings in Reader.tsx to use a smaller width like 768px (approx 75ch depending on font size).
content = content.replace("max_width: 720,", "max_width: 768,")

with open("components/Reader.tsx", "w", encoding="utf-8") as f:
    f.write(content)
