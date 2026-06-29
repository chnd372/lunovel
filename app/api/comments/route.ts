/**
 * /api/comments
 *   GET  ?chapter_id=...        → list approved comments for chapter
 *   POST { chapter_id, novel_id, parent_id?, author_name, content, ... }
 *      → create a new comment (rate-limited + validated)
 */
import { NextRequest, NextResponse } from "next/server";
import {
  createComment,
  detectBackend,
  listComments,
  validateCommentInput,
} from "@/lib/comments";
import { buildCommentTree } from "@/lib/comments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// --- Rate limiting ---------------------------------------------------------
// Simple in-memory token bucket. Sufficient for a small reader site; for
// production-scale swap to Redis with a sorted-set sliding window.
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 min
const RATE_MAX = 3; // 3 comments per window per IP

interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

function clientKey(req: NextRequest): string {
  // Vercel/Next sets x-forwarded-for; fall back to other hints
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anon";
}

function rateLimit(key: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }
  if (b.count >= RATE_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true };
}

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Handlers --------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapter_id");
  if (!chapterId) {
    return NextResponse.json(
      { error: "chapter_id wajib" },
      { status: 400 }
    );
  }
  try {
    const backend = detectBackend();
    if (backend === "none") {
      return NextResponse.json({
        backend,
        comments: [],
        tree: [],
        count: 0,
        message: "Backend belum dikonfigurasi",
      });
    }
    const flat = await listComments(chapterId);
    const tree = buildCommentTree(flat);
    return NextResponse.json({
      backend,
      comments: flat,
      tree,
      count: flat.length,
    });
  } catch (err) {
    console.error("[comments GET] failed", err);
    return NextResponse.json(
      { error: "Gagal memuat komentar" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const rl = rateLimit(key);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Terlalu banyak komentar. Coba lagi dalam ${Math.ceil(
          (rl.retryAfterSec ?? 60) / 60
        )} menit.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec ?? 60) },
      }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot — hidden field bots love to fill
  if (body.website && String(body.website).trim().length > 0) {
    // Pretend success but don't save
    return NextResponse.json({ ok: true, comment: null });
  }

  const validated = validateCommentInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const ipHash = await sha256(key + "|" + (req.headers.get("user-agent") ?? ""));
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

  try {
    const comment = await createComment({
      ...validated.data,
      ip_hash: ipHash.slice(0, 32),
      user_agent: ua,
    });
    return NextResponse.json({ ok: true, comment });
  } catch (err: any) {
    console.error("[comments POST] failed", err);
    return NextResponse.json(
      {
        error:
          err?.message ??
          "Backend komentar belum dikonfigurasi. Hubungi admin.",
      },
      { status: 500 }
    );
  }
}