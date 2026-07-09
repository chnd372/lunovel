import { NextRequest, NextResponse } from "next/server";
import { kv, hasKV } from "@/lib/kv";

/**
 * Public find-and-replace rules for "Perbaikan Kata".
 * Shared across all visitors of a given novel — stored in Vercel KV.
 *
 * Key shape:
 *   perbaikan:${slug}       → JSON array of { dari, ke, caseSensitive, by?, createdAt }
 *   perbaikan:${slug}:meta  → { count, lastUpdated } (for cheap stats)
 *
 * POST adds/updates a rule (dedup by `dari`, case-insensitive).
 * DELETE removes by index.
 */

export const dynamic = "force-dynamic";

interface Rule {
  dari: string;
  ke: string;
  caseSensitive: boolean;
  by?: string;
  createdAt: string;
}

function ruleKey(slug: string) {
  return `perbaikan:${slug}`;
}

function metaKey(slug: string) {
  return `perbaikan:${slug}:meta`;
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!hasKV || !kv) {
    return NextResponse.json(
      { backend: "none", rules: [], count: 0, message: "KV belum dikonfigurasi" },
      { status: 200 },
    );
  }

  try {
    const raw = await kv.get(ruleKey(slug));
    const rules: Rule[] = Array.isArray(raw) ? raw : [];
    // Sort newest first
    rules.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return NextResponse.json({ backend: "kv", rules, count: rules.length });
  } catch (e) {
    return NextResponse.json({ backend: "kv", rules: [], count: 0, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!hasKV || !kv) {
    return NextResponse.json({ ok: false, error: "KV belum dikonfigurasi" }, { status: 503 });
  }

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 }); }
  const { dari, ke, caseSensitive, by } = body ?? {};

  if (typeof dari !== "string" || typeof ke !== "string" || !dari.trim()) {
    return NextResponse.json({ ok: false, error: "Field `dari` wajib string tidak kosong" }, { status: 400 });
  }
  if (dari.trim() === ke) {
    return NextResponse.json({ ok: false, error: "`dari` dan `ke` harus berbeda" }, { status: 400 });
  }
  if (dari.length > 500 || ke.length > 500) {
    return NextResponse.json({ ok: false, error: "Panjang max 500 karakter per field" }, { status: 400 });
  }

  const trimmedDari = dari.trim();

  try {
    const raw = await kv.get(ruleKey(slug));
    const list: Rule[] = Array.isArray(raw) ? raw : [];
    const lower = trimmedDari.toLowerCase();
    const idx = list.findIndex((r) => r.dari.toLowerCase() === lower);

    const next: Rule = {
      dari: trimmedDari,
      ke,
      caseSensitive: Boolean(caseSensitive),
      by: typeof by === "string" ? by.slice(0, 60) : undefined,
      createdAt: new Date().toISOString(),
    };

    if (idx >= 0) list[idx] = next; else list.push(next);

    await kv.set(ruleKey(slug), list);
    await kv.set(metaKey(slug), { count: list.length, lastUpdated: next.createdAt });

    return NextResponse.json({ ok: true, count: list.length, rule: next });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  if (!hasKV || !kv) {
    return NextResponse.json({ ok: false, error: "KV belum dikonfigurasi" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const dari = searchParams.get("dari");
  const clearAll = searchParams.get("all") === "1";

  try {
    if (clearAll) {
      await kv.del(ruleKey(slug));
      await kv.del(metaKey(slug));
      return NextResponse.json({ ok: true, count: 0, cleared: true });
    }

    if (!dari) return NextResponse.json({ ok: false, error: "Param `dari` wajib" }, { status: 400 });

    const raw = await kv.get(ruleKey(slug));
    const list: Rule[] = Array.isArray(raw) ? raw : [];
    const lower = dari.toLowerCase();
    const next = list.filter((r) => r.dari.toLowerCase() !== lower);

    if (next.length === list.length) {
      return NextResponse.json({ ok: false, error: "Rule tidak ditemukan" }, { status: 404 });
    }

    await kv.set(ruleKey(slug), next);
    await kv.set(metaKey(slug), { count: next.length, lastUpdated: new Date().toISOString() });
    return NextResponse.json({ ok: true, count: next.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}