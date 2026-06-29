"use client";

/**
 * Comment thread component — WordPress-inspired UI.
 *
 * Renders below the chapter content. Self-contained:
 *   - Fetches comments from /api/comments?chapter_id=...
 *   - Renders a thread tree with reply support
 *   - Posts new comments via /api/comments
 *   - Saves author name/email in localStorage (the "Simpan nama..." checkbox)
 *
 * Works against three backends transparently (Supabase → Vercel KV → none).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Comment, CommentNode } from "@/lib/comments-types";

const STORAGE_KEY = "lunovel_comment_author";

interface SavedAuthor {
  name: string;
  email?: string;
  url?: string;
}

function loadSavedAuthor(): SavedAuthor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistAuthor(author: SavedAuthor | null) {
  try {
    if (author) localStorage.setItem(STORAGE_KEY, JSON.stringify(author));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// Deterministic avatar color from name
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const palette = [
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-sky-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-fuchsia-500 to-pink-600",
    "from-indigo-500 to-blue-700",
    "from-lime-500 to-green-600",
  ];
  return palette[Math.abs(hash) % palette.length];
}

function initial(name: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  return trimmed[0].toUpperCase();
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Render content with simple Markdown-lite (line breaks + auto-link).
 * Keeps HTML escaped so users can't inject scripts.
 */
function renderContent(raw: string): React.ReactNode {
  const lines = raw.split(/\n+/);
  return lines.map((line, i) => {
    // Escape HTML
    let html = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    html = html.replace(/(^|\s)\*([^*]+)\*/g, "$1<em>$2</em>");
    // Inline code `text`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1 rounded bg-black/20 dark:bg-white/10 text-sm">$1</code>');
    // Auto-link URLs
    html = html.replace(
      /\bhttps?:\/\/[^\s<]+/g,
      (u) =>
        `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow ugc" class="text-sky-400 hover:underline break-all">${u}</a>`
    );

    return (
      <p
        key={i}
        className="mb-2 last:mb-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}

interface FormState {
  author_name: string;
  author_email: string;
  author_url: string;
  content: string;
  remember: boolean;
}

interface Props {
  chapterId: string;
  novelId: string;
  /** When provided, shows backend status (used for the admin/dev banner) */
  showBackendInfo?: boolean;
}

export default function Comments({ chapterId, novelId, showBackendInfo }: Props) {
  const [tree, setTree] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>("");
  const [count, setCount] = useState(0);

  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const formRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const [form, setForm] = useState<FormState>({
    author_name: "",
    author_email: "",
    author_url: "",
    content: "",
    remember: true,
  });

  // Load saved author on mount
  useEffect(() => {
    const saved = loadSavedAuthor();
    if (saved) {
      setForm((f) => ({
        ...f,
        author_name: saved.name ?? "",
        author_email: saved.email ?? "",
        author_url: saved.url ?? "",
        remember: true,
      }));
    }
  }, []);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/comments?chapter_id=${encodeURIComponent(chapterId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Gagal memuat komentar");
      }
      const data = await res.json();
      setTree(data.tree ?? []);
      setCount(data.count ?? 0);
      setBackend(data.backend ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat komentar");
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  function resetForm() {
    setForm((f) => ({ ...f, content: "" }));
    setReplyTo(null);
    setSubmitError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (form.content.trim().length === 0) {
      setSubmitError("Komentar tidak boleh kosong");
      return;
    }
    if (form.author_name.trim().length < 2) {
      setSubmitError("Nama minimal 2 karakter");
      return;
    }

    setSubmitting(true);
    try {
      // Honeypot
      const website = (document.getElementById("comments-website") as HTMLInputElement | null)?.value ?? "";

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapter_id: chapterId,
          novel_id: novelId,
          parent_id: replyTo?.id ?? null,
          author_name: form.author_name.trim(),
          author_email: form.author_email.trim() || undefined,
          author_url: form.author_url.trim() || undefined,
          content: form.content.trim(),
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim komentar");
      }

      // Persist author if checkbox on
      if (form.remember) {
        persistAuthor({
          name: form.author_name.trim(),
          email: form.author_email.trim() || undefined,
          url: form.author_url.trim() || undefined,
        });
      } else {
        persistAuthor(null);
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      resetForm();

      // Refresh list
      await fetchComments();
    } catch (e: any) {
      setSubmitError(e?.message ?? "Gagal mengirim komentar");
    } finally {
      setSubmitting(false);
    }
  }

  function startReply(c: CommentNode) {
    setReplyTo(c);
    setSubmitError(null);
    // Scroll to form
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      contentRef.current?.focus();
    });
  }

  // Recursively render a tree
  function renderNode(node: CommentNode): React.ReactNode {
    const indent =
      node.depth === 0
        ? ""
        : node.depth === 1
        ? "ml-6 md:ml-10"
        : node.depth === 2
        ? "ml-10 md:ml-16"
        : "ml-12 md:ml-20";

    return (
      <li key={node.id} className={`${indent} relative`}>
        {node.depth > 0 && (
          <div
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-px bg-current/10"
          />
        )}
        <div className="flex gap-3 py-4 border-b border-current/10 last:border-b-0">
          <div
            className={`shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(
              node.author_name
            )} text-white grid place-items-center font-semibold text-sm select-none`}
            aria-hidden
          >
            {initial(node.author_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {node.author_url ? (
                <a
                  href={node.author_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="font-semibold text-sky-400 hover:underline break-all"
                >
                  {node.author_name}
                </a>
              ) : (
                <span className="font-semibold">{node.author_name}</span>
              )}
              <time
                dateTime={node.created_at}
                className="text-xs opacity-60"
              >
                {formatDate(node.created_at)}
              </time>
            </div>
            <div className="mt-1 text-[0.95rem] leading-relaxed break-words">
              {renderContent(node.content)}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => startReply(node)}
                className="text-xs px-2 py-1 rounded border border-sky-500/60 text-sky-400 hover:bg-sky-500/10 transition"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
        {node.replies.length > 0 && (
          <ul className="list-none pl-0">
            {node.replies.map((r) => renderNode(r))}
          </ul>
        )}
      </li>
    );
  }

  const empty = !loading && tree.length === 0;

  return (
    <section
      id="comments"
      aria-label="Komentar"
      className="mx-auto px-4 md:px-6 pb-16 pt-2"
      style={{ maxWidth: 760 }}
    >
      <div className="rounded-xl border border-current/10 bg-black/5 dark:bg-white/5 p-5 md:p-7">
        <header className="mb-5">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span aria-hidden>💬</span>
            <span>
              Komentar <span className="opacity-60 font-normal">({count})</span>
            </span>
          </h2>
          {showBackendInfo && backend && (
            <p className="text-xs opacity-50 mt-1">
              backend: <code>{backend}</code>
            </p>
          )}
        </header>

        {/* Comment list */}
        <div className="mb-6">
          {loading && (
            <div className="py-8 text-center text-sm opacity-60">
              <div className="inline-block w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2 align-[-2px]" />
              Memuat komentar…
            </div>
          )}
          {error && (
            <div className="py-4 px-3 rounded border border-red-500/40 bg-red-500/10 text-sm">
              {error}
            </div>
          )}
          {empty && !loading && !error && (
            <div className="py-8 text-center text-sm opacity-60">
              Belum ada komentar. Jadi yang pertama!
            </div>
          )}
          {!loading && !error && tree.length > 0 && (
            <ul className="list-none pl-0">
              {tree.map((c) => renderNode(c))}
            </ul>
          )}
        </div>

        {/* Reply banner */}
        {replyTo && (
          <div className="mb-3 px-3 py-2 rounded border border-sky-500/40 bg-sky-500/10 text-sm flex items-center justify-between gap-2">
            <span>
              Membalas{" "}
              <strong>{replyTo.author_name}</strong>:{" "}
              <span className="opacity-70 line-clamp-1 inline-block max-w-[40ch] align-middle">
                {replyTo.content.slice(0, 80)}
                {replyTo.content.length > 80 ? "…" : ""}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="shrink-0 text-xs px-2 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
            >
              ✕ Batal
            </button>
          </div>
        )}

        {/* Form */}
        <div ref={formRef}>
          <h3 className="text-lg font-bold mb-1">Tinggalkan Balasan</h3>
          <p className="text-xs opacity-60 mb-4">
            Alamat email Anda tidak akan dipublikasikan. Ruas yang wajib
            ditandai <span className="text-red-400">*</span>
          </p>

          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            {/* Honeypot — invisible to humans */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label>
                Website
                <input
                  id="comments-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </label>
            </div>

            <div>
              <label
                htmlFor="cmt-content"
                className="block text-sm font-medium mb-1"
              >
                Komentar <span className="text-red-400">*</span>
              </label>
              <textarea
                id="cmt-content"
                ref={contentRef}
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                rows={5}
                maxLength={5000}
                required
                className="w-full rounded-md bg-black/10 dark:bg-white/5 border border-current/15 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 px-3 py-2 text-sm resize-y"
                placeholder={
                  replyTo
                    ? `Balas ${replyTo.author_name}…`
                    : "Tulis komentarmu di sini…"
                }
              />
              <div className="text-xs opacity-50 mt-1 text-right">
                {form.content.length}/5000
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cmt-name"
                  className="block text-sm font-medium mb-1"
                >
                  Nama <span className="text-red-400">*</span>
                </label>
                <input
                  id="cmt-name"
                  type="text"
                  value={form.author_name}
                  onChange={(e) =>
                    setForm({ ...form, author_name: e.target.value })
                  }
                  maxLength={60}
                  required
                  className="w-full rounded-md bg-black/10 dark:bg-white/5 border border-current/15 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 px-3 py-2 text-sm"
                  placeholder="Nama tampilan"
                />
              </div>
              <div>
                <label
                  htmlFor="cmt-email"
                  className="block text-sm font-medium mb-1"
                >
                  Email
                </label>
                <input
                  id="cmt-email"
                  type="email"
                  value={form.author_email}
                  onChange={(e) =>
                    setForm({ ...form, author_email: e.target.value })
                  }
                  className="w-full rounded-md bg-black/10 dark:bg-white/5 border border-current/15 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 px-3 py-2 text-sm"
                  placeholder="opsional"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs opacity-80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) =>
                  setForm({ ...form, remember: e.target.checked })
                }
                className="mt-0.5"
              />
              <span>
                Simpan nama, email, dan situs web saya pada peramban ini
                untuk komentar saya berikutnya.
              </span>
            </label>

            {submitError && (
              <div className="px-3 py-2 rounded border border-red-500/40 bg-red-500/10 text-sm">
                {submitError}
              </div>
            )}
            {savedOk && (
              <div className="px-3 py-2 rounded border border-emerald-500/40 bg-emerald-500/10 text-sm">
                ✓ Komentar terkirim
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-5 py-2 rounded-md bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
                    Mengirim…
                  </>
                ) : (
                  "Kirim Komentar"
                )}
              </button>
              {(replyTo || form.content) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm opacity-70 hover:opacity-100"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}