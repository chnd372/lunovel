import type { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";

const SITE = "https://lunovel.vercel.app";

// Generated at build time (default Next.js behavior for sitemap).
// force-dynamic is INTENTIONALLY avoided: that would try fs reads
// at request time on the serverless runtime where data/ isn't bundled.

type Novel = { id: string; slug: string; updated_at: string };
type Chapter = { novel_id: string; number: number; published_at: string };

async function readJSON<T>(rel: string): Promise<T> {
  const buf = await fs.readFile(path.join(process.cwd(), rel), "utf-8");
  return JSON.parse(buf) as T;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/profile`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const novels = await readJSON<Novel[]>("data/novels.json");
  // Chapters reference the novel by `novel_id` (e.g. "moip"),
  // pages live under `/novel/<slug>`. Register both keys.
  const registeredIds = new Set<string>();
  const idToSlug = new Map<string, string>();
  for (const n of novels) {
    registeredIds.add(n.id);
    registeredIds.add(n.slug);
    idToSlug.set(n.id, n.slug);
    idToSlug.set(n.slug, n.slug);
  }
  const novelRoutes: MetadataRoute.Sitemap = novels.map((n) => ({
    url: `${SITE}/novel/${n.slug}`,
    lastModified: n.updated_at || now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const chaptersDir = path.join(process.cwd(), "data/chapters");
  const files = await fs.readdir(chaptersDir);
  const chapterRoutes: MetadataRoute.Sitemap = [];

  await Promise.all(
    files
      .filter((f) => f.endsWith(".json") && f !== "moip-meta.json")
      .map(async (f) => {
        const chunks = await readJSON<Chapter[]>(`data/chapters/${f}`);
        for (const c of chunks) {
          if (!registeredIds.has(c.novel_id)) continue;
          const slug = idToSlug.get(c.novel_id) ?? c.novel_id;
          // c.number may arrive as float ("957.0") from chunk JSON
          const n = Number(c.number);
          const num = Number.isInteger(n) ? n : Math.trunc(n);
          if (!Number.isFinite(num)) continue;
          chapterRoutes.push({
            url: `${SITE}/read/${slug}/${num}`,
            lastModified: c.published_at || now,
            changeFrequency: "monthly",
            priority: 0.5,
          });
        }
      })
  );

  return [...staticRoutes, ...novelRoutes, ...chapterRoutes];
}
