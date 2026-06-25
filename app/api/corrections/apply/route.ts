import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/corrections/apply
 * Apply approved corrections to chapter content.
 * 
 * Body: { novel_id: string, chapter_content: string }
 * Response: { content: string, applied_count: number, replacements: Array<{from, to}> }
 */
export async function POST(req: NextRequest) {
  try {
    const { novel_id, chapter_content, corrections } = await req.json();

    if (!novel_id || !chapter_content) {
      return NextResponse.json(
        { error: "Missing novel_id or chapter_content" },
        { status: 400 }
      );
    }

    // Apply each approved correction
    let modified = chapter_content;
    const replacements: Array<{ from: string; to: string }> = [];

    const toApply: Array<{ original: string; suggested: string }> = corrections || [];

    for (const corr of toApply) {
      const before = modified;
      modified = modified.replaceAll(corr.original, corr.suggested);
      if (modified !== before) {
        replacements.push({ from: corr.original, to: corr.suggested });
      }
    }

    return NextResponse.json({
      content: modified,
      applied_count: replacements.length,
      replacements,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
