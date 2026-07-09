"use client";

import { useState, useCallback } from "react";

/**
 * Personal word-correction entry.
 * Stored in localStorage under key `perbaikan_${slug}`.
 * Unlike `corrections` (which is crowdsourced/optional), these are private
 * find-and-replace rules the user applies to their own reading experience.
 */
export interface PerbaikanKata {
  dari: string;        // original (wrong) text
  ke: string;          // replacement
  caseSensitive: boolean;
  createdAt: string;   // ISO timestamp
}

const keyFor = (slug: string) => `perbaikan_${slug}`;

/** SSR-safe read. Returns [] on server. */
export function getPerbaikan(slug: string): PerbaikanKata[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(slug));
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
  try {
    localStorage.setItem(keyFor(slug), JSON.stringify(list));
  } catch {}
}

/** Append (or replace existing match by `dari`). */
export function addPerbaikan(
  slug: string,
  entry: Omit<PerbaikanKata, "createdAt">,
): PerbaikanKata[] {
  const list = getPerbaikan(slug);
  // dedupe by `dari` (case-insensitive)
  const lower = entry.dari.toLowerCase();
  const idx = list.findIndex((p) => p.dari.toLowerCase() === lower);
  const next: PerbaikanKata = { ...entry, createdAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = next; else list.push(next);
  persist(slug, list);
  return list;
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

export function clearPerbaikan(slug: string): void {
  persist(slug, []);
}

/**
 * Apply all personal find-and-replace rules to text.
 * Pure function (uses getPerbaikan which is SSR-safe).
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
  // Escape regex special chars in `dari`
  const escaped = rule.dari.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const flags = "g" + (rule.caseSensitive ? "" : "i");
  // No \b boundaries — phrases can include spaces/punct.
  // We want literal replacement including unicode.
  const re = new RegExp(escaped, flags);
  return text.replace(re, rule.ke);
}

/** Total count of replacements across all novels (for site stats). */
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
    clearPerbaikan(slug);
    setList([]);
  }, [slug]);

  return { list, refresh, add, update, remove, clear };
}