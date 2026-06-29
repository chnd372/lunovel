/**
 * Comment storage layer.
 *
 * Storage priority:
 *   1. Supabase (table: comments)  — when NEXT_PUBLIC_SUPABASE_URL is set
 *   2. Vercel KV / Upstash Redis   — when KV_REST_API_URL is set
 *   3. Disabled (returns empty)    — when neither is configured
 *
 * Each comment is a flat record. Threading is reconstructed client-side
 * by parent_id (matches WordPress comment_parent semantics).
 */
import { hasSupabase, supabase } from "./supabase";
import { hasKV, kv, logBackendOnce } from "./kv";
import type {
  Comment,
  CommentNode,
  CreateCommentInput,
} from "./comments-types";
import {
  MAX_AUTHOR_NAME_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_URL_LENGTH,
  MIN_AUTHOR_NAME_LENGTH,
} from "./comments-types";

export type BackendKind = "supabase" | "kv" | "none";

export function detectBackend(): BackendKind {
  if (hasSupabase && supabase) return "supabase";
  if (hasKV && kv) return "kv";
  return "none";
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

async function listCommentsSupabase(chapterId: string): Promise<Comment[]> {
  const { data, error } = await supabase!
    .from("comments")
    .select("*")
    .eq("chapter_id", chapterId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

async function createCommentSupabase(input: CreateCommentInput): Promise<Comment> {
  const row = {
    chapter_id: input.chapter_id,
    novel_id: input.novel_id,
    parent_id: input.parent_id ?? null,
    author_name: input.author_name,
    author_email: input.author_email || null,
    author_url: input.author_url || null,
    content: input.content,
    ip_hash: input.ip_hash || null,
    user_agent: input.user_agent || null,
    is_approved: true,
  };
  const { data, error } = await supabase!
    .from("comments")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  // Normalise null → undefined to match the Comment type
  const d = data as any;
  return {
    ...(d as Comment),
    author_email: d.author_email ?? undefined,
    author_url: d.author_url ?? undefined,
    ip_hash: d.ip_hash ?? undefined,
    user_agent: d.user_agent ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Vercel KV / Upstash Redis
//
// Key layout:
//   chapter:{chapter_id}:comments  →  JSON array of comments
// Each chapter stores its own list so reads stay O(1) and cache-friendly.
// ---------------------------------------------------------------------------

function kvKey(chapterId: string): string {
  return `chapter:${chapterId}:comments`;
}

async function listCommentsKV(chapterId: string): Promise<Comment[]> {
  const raw = (await kv!.get<string>(kvKey(chapterId))) as string | null;
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw as Comment[]);
    return (parsed as Comment[]).filter((c) => c.is_approved);
  } catch {
    return [];
  }
}

async function createCommentKV(input: CreateCommentInput): Promise<Comment> {
  const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const comment: Comment = {
    id,
    chapter_id: input.chapter_id,
    novel_id: input.novel_id,
    parent_id: input.parent_id ?? null,
    author_name: input.author_name,
    author_email: input.author_email || undefined,
    author_url: input.author_url || undefined,
    content: input.content,
    ip_hash: input.ip_hash,
    user_agent: input.user_agent,
    is_approved: true,
    created_at: new Date().toISOString(),
  };

  const existing = await listCommentsKV(input.chapter_id);
  existing.push(comment);

  // Cap at 1000 per chapter to stay within Vercel KV free tier (256 MB)
  const trimmed = existing.slice(-1000);

  await kv!.set(kvKey(input.chapter_id), JSON.stringify(trimmed));
  return comment;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listComments(chapterId: string): Promise<Comment[]> {
  const backend = detectBackend();
  logBackendOnce(backend);
  if (backend === "supabase") return listCommentsSupabase(chapterId);
  if (backend === "kv") return listCommentsKV(chapterId);
  return [];
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const backend = detectBackend();
  logBackendOnce(backend);
  if (backend === "supabase") return createCommentSupabase(input);
  if (backend === "kv") return createCommentKV(input);
  throw new Error(
    "Comment backend not configured. Set NEXT_PUBLIC_SUPABASE_URL+ANON_KEY or KV_REST_API_URL+KV_REST_API_TOKEN."
  );
}

/**
 * Build a threaded tree from a flat list.
 * Sorted: oldest first (parent), replies chronological.
 */
export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  comments.forEach((c) =>
    byId.set(c.id, { ...c, replies: [], depth: 0 })
  );
  const roots: CommentNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      const parent = byId.get(node.parent_id)!;
      node.depth = Math.min(parent.depth + 1, 3); // cap visual indent at 3
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; data: CreateCommentInput }
  | { ok: false; error: string };

export function validateCommentInput(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid body" };
  }
  const chapter_id = String(body.chapter_id ?? "").trim();
  const novel_id = String(body.novel_id ?? "").trim();
  const author_name = String(body.author_name ?? "").trim();
  const content = String(body.content ?? "").trim();
  const parent_id =
    body.parent_id == null || body.parent_id === ""
      ? null
      : String(body.parent_id);
  const author_email = body.author_email
    ? String(body.author_email).trim()
    : undefined;
  const author_url = body.author_url
    ? String(body.author_url).trim()
    : undefined;
  const ip_hash = body.ip_hash ? String(body.ip_hash) : undefined;
  const user_agent = body.user_agent ? String(body.user_agent) : undefined;

  if (!chapter_id) return { ok: false, error: "chapter_id wajib" };
  if (!novel_id) return { ok: false, error: "novel_id wajib" };
  if (author_name.length < MIN_AUTHOR_NAME_LENGTH) {
    return { ok: false, error: `Nama minimal ${MIN_AUTHOR_NAME_LENGTH} karakter` };
  }
  if (author_name.length > MAX_AUTHOR_NAME_LENGTH) {
    return { ok: false, error: `Nama maksimal ${MAX_AUTHOR_NAME_LENGTH} karakter` };
  }
  if (content.length === 0) {
    return { ok: false, error: "Komentar tidak boleh kosong" };
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return { ok: false, error: `Komentar maksimal ${MAX_COMMENT_LENGTH} karakter` };
  }
  if (author_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
    return { ok: false, error: "Format email tidak valid" };
  }
  if (author_url && author_url.length > MAX_URL_LENGTH) {
    return { ok: false, error: `URL maksimal ${MAX_URL_LENGTH} karakter` };
  }
  // Block obvious spam patterns
  if (/(https?:\/\/[^\s]+){3,}/i.test(content)) {
    return { ok: false, error: "Terlalu banyak link di komentar" };
  }

  return {
    ok: true,
    data: {
      chapter_id,
      novel_id,
      author_name,
      content,
      parent_id,
      author_email,
      author_url,
      ip_hash,
      user_agent,
    },
  };
}