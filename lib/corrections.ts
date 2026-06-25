"use client";

import { useState, useCallback } from "react";

/**
 * Correction suggestion stored in localStorage.
 * Structure mirrors what the API would store in Supabase.
 */
export interface Correction {
  id: string;
  novel_id: string;
  novel_slug: string;
  chapter_id: string;
  chapter_number: number;
  original: string;           // the wrong text
  suggested: string;          // the corrected text
  context: string;            // surrounding text for disambiguation (40 chars before + after)
  status: "pending" | "approved" | "rejected";
  suggested_by: string;       // "anonymous" or nickname
  created_at: string;
  resolved_at?: string;
}

const CORRECTIONS_KEY = "lunovel_corrections";

function generateId(): string {
  return `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getCorrections(novelId?: string, status?: string): Correction[] {
  if (typeof window === "undefined") return [];
  try {
    const all: Correction[] = JSON.parse(localStorage.getItem(CORRECTIONS_KEY) || "[]");
    return all.filter((c) => {
      if (novelId && c.novel_id !== novelId) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  } catch { return []; }
}

export function getAllCorrections(): Correction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CORRECTIONS_KEY) || "[]");
  } catch { return []; }
}

export function saveCorrection(correction: Omit<Correction, "id" | "created_at" | "status">): Correction {
  const entry: Correction = {
    ...correction,
    id: generateId(),
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const all = getAllCorrections();
  all.unshift(entry);
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(all));
  return entry;
}

export function updateCorrectionStatus(id: string, status: "approved" | "rejected"): Correction | null {
  const all = getAllCorrections();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx].status = status;
  all[idx].resolved_at = new Date().toISOString();
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(all));
  return all[idx];
}

export function deleteCorrection(id: string): void {
  const all = getAllCorrections().filter((c) => c.id !== id);
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(all));
}

export function getPendingCount(novelId?: string): number {
  return getCorrections(novelId, "pending").length;
}

/**
 * Apply all approved corrections to a text string.
 * Returns the modified text and list of applied corrections.
 */
export function applyCorrections(text: string, novelId: string): {
  text: string;
  applied: Correction[];
} {
  const approved = getCorrections(novelId, "approved");
  let modified = text;
  const applied: Correction[] = [];

  for (const corr of approved) {
    const before = modified;
    modified = modified.replaceAll(corr.original, corr.suggested);
    if (modified !== before) {
      applied.push(corr);
    }
  }

  return { text: modified, applied };
}

/**
 * React hook for correction state management
 */
export function useCorrections(novelId: string) {
  const [corrections, setCorrections] = useState<Correction[]>([]);

  const refresh = useCallback(() => {
    setCorrections(getCorrections(novelId));
  }, [novelId]);

  const suggest = useCallback((
    chapterId: string,
    chapterNumber: number,
    novelSlug: string,
    original: string,
    suggested: string,
    context: string,
    nickname?: string,
  ) => {
    saveCorrection({
      novel_id: novelId,
      novel_slug: novelSlug,
      chapter_id: chapterId,
      chapter_number: chapterNumber,
      original,
      suggested,
      context,
      suggested_by: nickname || "anonymous",
    });
    refresh();
  }, [novelId, refresh]);

  const approve = useCallback((id: string) => {
    updateCorrectionStatus(id, "approved");
    refresh();
  }, [refresh]);

  const reject = useCallback((id: string) => {
    updateCorrectionStatus(id, "rejected");
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    deleteCorrection(id);
    refresh();
  }, [refresh]);

  return { corrections, refresh, suggest, approve, reject, remove };
}
