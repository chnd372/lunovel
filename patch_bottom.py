import re

with open("components/BottomNav.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r'className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-bg-light dark:bg-bg-dark border-t border-black/10 dark:border-white/10 flex items-stretch justify-around pb-\[env\(safe-area-inset-bottom\)\]"',
    r'className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-bg-light/85 dark:bg-bg-dark/85 backdrop-blur-xl border-t border-black/5 dark:border-white/5 flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_30px_rgba(0,0,0,0.05)] transition-colors duration-300"',
    content
)

with open("components/BottomNav.tsx", "w", encoding="utf-8") as f:
    f.write(content)
