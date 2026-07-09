"use client";

import { useState, useCallback } from "react";

/**
 * Personal + shared word-correction entry.
 * Storage strategy (hybrid):
 *   1. localStorage `perbaikan_${slug}` — local cache, works offline
 *   2. Vercel KV via /api/perbaikan/[slug]   — shared with all visitors
 *
 * On mount, the Reader fetches shared rules from the API and writes them to
 * localStorage (KV is authoritative). New rules added by the user go to BOTH:
 *   - localStorage immediately (instant render)
 *   - API POST (so others see it)
 *
 * If the API is down or KV isn't configured, the feature still works locally.
 */

export interface PerbaikanKata {
  dari: string;          // original (wrong) text
  ke: string;            // replacement
  caseSensitive: boolean;
  createdAt: string;     // ISO timestamp
  by?: string;           // contributor name (when sourced from shared)
}

const localKey = (slug: string) => `perbaikan_${slug}`;

/** SSR-safe local read. Returns [] on server. */
export function getPerbaikan(slug: string): PerbaikanKata[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(localKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch { return []; }
}

function isValid(x: any): x is PerbaikanKata {
  return x && typeof x.dari === "string" && typeof x.ke === "string"
    && typeof x.caseSensitive === "boolean" && x.dari.length > 0;
}

function persist(slug: string, list: PerbaikanKata[]) {
  try { localStorage.setItem(localKey(slug), JSON.stringify(list)); } catch {}
}

/** Merge: shared rules win on conflict (by `dari`, case-insensitive). */
function mergeRules(local: PerbaikanKata[], shared: PerbaikanKata[]): PerbaikanKata[] {
  const out: PerbaikanKata[] = [];
  const seenLower = new Set<string>();
  // Shared first (authoritative)
  for (const r of shared) {
    const k = r.dari.toLowerCase();
    if (seenLower.has(k)) continue;
    seenLower.add(k);
    out.push(r);
  }
  // Then any local-only entries (offline-only corrections)
  for (const r of local) {
    const k = r.dari.toLowerCase();
    if (seenLower.has(k)) continue;
    seenLower.add(k);
    out.push(r);
  }
  return out;
}

/**
 * Fetch shared rules from API and merge into localStorage.
 * Safe to call on every chapter mount — debounced via AbortController upstream.
 * Returns the merged list.
 */
export async function syncSharedRules(
  slug: string,
  signal?: AbortSignal,
): Promise<{ merged: PerbaikanKata[]; backend: "kv" | "none" }> {
  const local = getPerbaikan(slug);
  try {
    const res = await fetch(`/api/perbaikan/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const shared: PerbaikanKata[] = Array.isArray(json.rules)
      ? json.rules.filter(isValid)
      : [];
    const merged = mergeRules(local, shared);
    persist(slug, merged);
    return { merged, backend: json.backend === "kv" ? "kv" : "none" };
  } catch {
    return { merged: local, backend: "none" };
  }
}

/** Append (or replace existing match by `dari`). Returns new list. */
export function addPerbaikan(
  slug: string,
  entry: Omit<PerbaikanKata, "createdAt">,
): PerbaikanKata[] {
  const list = getPerbaikan(slug);
  const lower = entry.dari.toLowerCase();
  const idx = list.findIndex((p) => p.dari.toLowerCase() === lower);
  const next: PerbaikanKata = { ...entry, createdAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = next; else list.push(next);
  persist(slug, list);
  return list;
}

/** Async variant: save locally AND post to API for sharing. */
export async function addPerbaikanShared(
  slug: string,
  entry: Omit<PerbaikanKata, "createdAt">,
): Promise<{ list: PerbaikanKata[]; shared: boolean }> {
  const list = addPerbaikan(slug, entry);
  let shared = false;
  try {
    const res = await fetch(`/api/perbaikan/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dari: entry.dari,
        ke: entry.ke,
        caseSensitive: entry.caseSensitive,
        by: entry.by,
      }),
    });
    shared = res.ok;
  } catch { /* offline — still saved locally */ }
  return { list, shared };
}

export function updatePerbaikan(
  slug: string,
  idx: number,
  entry: Omit<PerbaikanKata, "createdAt">,
): PerbaikanKata[] {
  const list = getPerbaikan(slug);
  if (idx < 0 || idx >= list.length) return list;
  list[idx] = { ...entry, createdAt: list[idx].createdAt };
  persist(slug, list);
  return list;
}

export function removePerbaikan(slug: string, idx: number): PerbaikanKata[] {
  const list = getPerbaikan(slug).filter((_, i) => i !== idx);
  persist(slug, list);
  return list;
}

/** Async delete: remove locally + tell API. */
export async function removePerbaikanShared(
  slug: string,
  idx: number,
): Promise<PerbaikanKata[]> {
  const list = getPerbaikan(slug);
  const target = list[idx];
  const next = removePerbaikan(slug, idx);
  if (target) {
    try {
      await fetch(
        `/api/perbaikan/${encodeURIComponent(slug)}?dari=${encodeURIComponent(target.dari)}`,
        { method: "DELETE" },
      );
    } catch { /* ignore */ }
  }
  return next;
}

export async function clearPerbaikanShared(slug: string): Promise<void> {
  persist(slug, []);
  try {
    await fetch(`/api/perbaikan/${encodeURIComponent(slug)}?all=1`, {
      method: "DELETE",
    });
  } catch { /* ignore */ }
}

/**
 * Apply all find-and-replace rules to text. Pure sync function.
 * Reads from localStorage (which has been hydrated by syncSharedRules).
 */
export function applyPerbaikan(text: string, slug: string): {
  text: string;
  applied: PerbaikanKata[];
} {
  const list = getPerbaikan(slug);
  let modified = text;
  const applied: PerbaikanKata[] = [];
  for (const rule of list) {
    const before = modified;
    modified = replace(modified, rule);
    if (modified !== before) applied.push(rule);
  }
  return { text: modified, applied };
}

function replace(text: string, rule: PerbaikanKata): string {
  if (!rule.dari) return text;
  const escaped = rule.dari.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flags = "g" + (rule.caseSensitive ? "" : "i");
  return text.replace(new RegExp(escaped, flags), rule.ke);
}

/** Total count across all novels (local only). */
export function getAllPerbaikanCount(): number {
  if (typeof window === "undefined") return 0;
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("perbaikan_")) {
      try { count += JSON.parse(localStorage.getItem(k) || "[]").length; } catch {}
    }
  }
  return count;
}

/** React hook with refresh trigger. */
export function usePerbaikan(slug: string) {
  const [list, setList] = useState<PerbaikanKata[]>(() => getPerbaikan(slug));

  const refresh = useCallback(() => setList(getPerbaikan(slug)), [slug]);

  const add = useCallback((entry: Omit<PerbaikanKata, "createdAt">) => {
    setList(addPerbaikan(slug, entry));
  }, [slug]);

  const update = useCallback(
    (idx: number, entry: Omit<PerbaikanKata, "createdAt">) => {
      setList(updatePerbaikan(slug, idx, entry));
    },
    [slug],
  );

  const remove = useCallback((idx: number) => {
    setList(removePerbaikan(slug, idx));
  }, [slug]);

  const clear = useCallback(() => {
    persist(slug, []);
    setList([]);
  }, [slug]);

  const sync = useCallback(async () => {
    const { merged } = await syncSharedRules(slug);
    setList(merged);
  }, [slug]);

  return { list, refresh, add, update, remove, clear, sync };
}