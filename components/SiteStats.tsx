import { getAllNovels, getChaptersByNovel } from "@/lib/data";

export default async function SiteStats() {
  const novels = await getAllNovels();

  if (novels.length === 0) return null;

  const stats = await Promise.all(
    novels.map(async (n) => {
      const chapters = await getChaptersByNovel(n.id);
      return {
        chapters: chapters.length,
        words: chapters.reduce((s, c) => s + c.word_count, 0),
        hours: Math.round(
          chapters.reduce((s, c) => s + c.word_count, 0) / 200 / 60
        ),
      };
    })
  );

  const totalChapters = stats.reduce((s, c) => s + c.chapters, 0);
  const totalWords = stats.reduce((s, c) => s + c.words, 0);
  const totalHours = stats.reduce((s, c) => s + c.hours, 0);

  const cards = [
    { icon: "📚", label: "Novel", value: novels.length, sub: "tersedia" },
    {
      icon: "📖",
      label: "Chapter",
      value: totalChapters.toLocaleString("id-ID"),
      sub: "total chapter",
    },
    {
      icon: "✍️",
      label: "Kata",
      value: formatCompact(totalWords),
      sub: `${totalHours.toLocaleString("id-ID")} jam baca`,
    },
    {
      icon: "🏆",
      label: "Terjemahan",
      value: novels.filter((n) => n.type === "translated").length,
      sub: `${novels.filter((n) => n.type === "original").length} original`,
    },
  ];

  return (
    <section>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-card-light dark:bg-card-dark border border-black/5 dark:border-white/5 p-3 sm:p-5 hover:shadow-sm transition-all"
          >
            <div className="text-lg sm:text-2xl mb-1">{card.icon}</div>
            <div className="text-lg sm:text-2xl font-bold leading-tight">
              {card.value}
            </div>
            <div className="text-xs opacity-60 mt-0.5">{card.label}</div>
            <div className="text-[10px] opacity-40">{card.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "JT";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "RB";
  return num.toLocaleString("id-ID");
}
