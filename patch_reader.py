import re

with open("components/Reader.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the themes
old_themes = re.search(r"const themes: Record.*?};", content, re.S)
if old_themes:
    new_themes = """const themes: Record<ReaderTheme, { bg: string; text: string; label: string; icon: string }> = {
  light: { bg: "bg-[#fffcf2]", text: "text-[#2a2a2a]", label: "Terang", icon: "☀️" },
  sepia: { bg: "bg-[#f5ead5]", text: "text-[#433422]", label: "Sepia", icon: "📜" },
  dark:  { bg: "bg-[#0a0a0a]", text: "text-[#d4d4d4]", label: "Gelap",  icon: "🌙" },
  cyan:  { bg: "bg-[#0b141a]", text: "text-[#d1e2ec]", label: "Malam",  icon: "🌃" },
};"""
    content = content.replace(old_themes.group(0), new_themes)

# Apply font-novel (serif) to the title
content = re.sub(r'className="font-bold mb-4 font-serif"', 'className="font-bold mb-4 font-serif"', content) # wait, what's there?

with open("components/Reader.tsx", "w", encoding="utf-8") as f:
    f.write(content)
