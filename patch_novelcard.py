import re

with open("components/NovelCard.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace floating badges
old_badges = """        {/* Floating Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-30 flex flex-col sm:flex-row gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${statusColor[novel.status] ?? "bg-gray-500"}`}>
            {statusLabel[novel.status] ?? novel.status}
          </span>
        </div>
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-30 opacity-90 group-hover:opacity-100 transition-opacity">
          <span className="px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md text-[8px] sm:text-[10px] font-bold tracking-wider uppercase bg-black/50 text-white backdrop-blur-md border border-white/10 shadow-sm">
            {typeLabel[novel.type] ?? novel.type}
          </span>
        </div>"""

new_badges = """        {/* Floating Badges (Stacked on left to prevent clashing on mobile) */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-30 flex flex-col gap-1 items-start opacity-90 group-hover:opacity-100 transition-opacity">
          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${statusColor[novel.status] ?? "bg-gray-500"}`}>
            {statusLabel[novel.status] ?? novel.status}
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold tracking-wider uppercase bg-black/50 text-white backdrop-blur-md border border-white/10 shadow-sm">
            {typeLabel[novel.type] ?? novel.type}
          </span>
        </div>"""

content = content.replace(old_badges, new_badges)

# Replace info section title
old_title = """        <h3 className="font-heading font-bold text-sm sm:text-base leading-tight line-clamp-2 md:group-hover:text-accent active:text-accent transition-colors duration-300">
          {novel.title}
        </h3>"""

new_title = """        <h3 className="font-heading font-bold text-sm sm:text-base leading-tight line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] md:group-hover:text-accent active:text-accent transition-colors duration-300">
          {novel.title}
        </h3>"""

content = content.replace(old_title, new_title)

# Let's also ensure the author line is 1 line consistently 
old_author = """        {novel.author && (
          <p className="text-[10px] sm:text-xs opacity-70 line-clamp-1 font-medium">oleh {novel.author}</p>
        )}"""

# We'll just wrap it in a div that maintains a height if author is missing, but maybe author is always there. The issue was just title.
new_author = """        <div className="min-h-[1rem] sm:min-h-[1.25rem]">
          {novel.author && (
            <p className="text-[10px] sm:text-xs opacity-70 line-clamp-1 font-medium">oleh {novel.author}</p>
          )}
        </div>"""

content = content.replace(old_author, new_author)

with open("components/NovelCard.tsx", "w", encoding="utf-8") as f:
    f.write(content)

