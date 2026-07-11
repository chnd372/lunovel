import { NextResponse } from "next/server";
import { getAllNovels, allGenres } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1h cache; genres change rarely

/** Returns a sorted JSON array of unique genre strings across all novels.
 *  Used by the mobile drawer to render the genre list without bundling
 *  the full novels dataset into the client. */
export async function GET() {
  const novels = await getAllNovels();
  return NextResponse.json(allGenres(novels));
}
