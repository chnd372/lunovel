"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { saveCorrection, type Correction } from "@/lib/corrections";
import PerbaikanKataModal from "@/components/PerbaikanKataModal";

interface Props {
  novelId: string;
  novelSlug: string;
  chapterId: string;
  chapterNumber: number;
  contentRef: React.RefObject<HTMLDivElement>;
}

/**
 * Handles text selection in the reader content area.
 * Mobile-friendly: uses `selectionchange` (fires on iOS Safari) plus a debounce
 * to wait for the native selection toolbar / handles to settle.
 */
export default function TextSelectionHandler({
  novelId, novelSlug, chapterId, chapterNumber, contentRef,
}: Props) {
  const [selection, setSelection] = useState<{
    text: string;
    context: string;
    rect: DOMRect;
  } | null>(null);
  const [suggested, setSuggested] = useState("");
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPerbaikan, setShowPerbaikan] = useState(false);
  const [popupSaving, setPopupSaving] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>("");

  // Get selection state — but ONLY when it's inside the content area
  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const text = sel.toString().trim();
    if (!text || text.length < 1 || text.length > 200) return null;

    const range = sel.getRangeAt(0);
    const container = contentRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return null;

    const fullText = container.textContent || "";
    const startOffset = Math.max(0, range.startOffset - 60);
    const endOffset = Math.min(fullText.length, range.endOffset + 60);
    const context = fullText.slice(startOffset, endOffset);

    return { text, context, rect: range.getBoundingClientRect() };
  }, [contentRef]);

  // Listen for selection changes — fires on iOS Safari when user lifts fingers
  useEffect(() => {
    function onChange() {
      // Skip when tap-fix mode is active — it owns taps in the content area
      try {
        // (lazy key lookup per-selector since we don't have slug here, just check any tapfix_* key)
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith("tapfix_") && localStorage.getItem(k) === "1") return;
        }
      } catch {}

      // Debounce: iOS fires several selectionchange events as user drags handles
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const result = checkSelection();
        if (!result) {
          // Don't dismiss if user is interacting with popup
          if (!popupRef.current?.contains(document.activeElement)
              && !popupRef.current?.matches(":hover")) {
            // Only dismiss if selection actually disappeared
            if (lastTextRef.current) setSelection(null);
          }
          lastTextRef.current = "";
          return;
        }
        // Avoid re-rendering with same text
        if (result.text === lastTextRef.current) return;
        lastTextRef.current = result.text;
        setSelection(result);
        setSuggested("");
        setNote("");
        setSubmitted(false);
      }, 250);
    }

    document.addEventListener("selectionchange", onChange);

    // Touch events still useful on some Android browsers
    function onTouchEnd() {
      onChange();
    }
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("selectionchange", onChange);
      document.removeEventListener("touchend", onTouchEnd);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [checkSelection]);

  function onSubmit() {
    if (!selection || !suggested.trim()) return;
    if (suggested.trim() === selection.text) return;

    saveCorrection({
      novel_id: novelId,
      novel_slug: novelSlug,
      chapter_id: chapterId,
      chapter_number: chapterNumber,
      original: selection.text,
      suggested: suggested.trim(),
      context: selection.context,
      suggested_by: nickname.trim() || "anon",
      note: note.trim() || undefined,
    });

    setSubmitted(true);
    setTimeout(() => setSelection(null), 2000);
  }

  function onPerbaikanSaved() {
    if (!selection) return;
    // The PerbaikanKataModal already wrote to localStorage + shared API.
    // Just notify the Reader so it re-renders content with the new rule.
    try {
      window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
        detail: { slug: novelSlug },
      }));
    } catch {}
  }

  if (!selection) return null;

  const wordCount = selection.text.split(/\s+/).length;
  const charCount = selection.text.length;

  // Popup positioning — clamps to viewport with safe-area aware offsets
  const popupWidth = Math.min(320, window.innerWidth - 16);
  const popupLeft = Math.max(8, Math.min(
    selection.rect.left + selection.rect.width / 2 - popupWidth / 2,
    window.innerWidth - popupWidth - 8,
  ));
  const preferBelow = selection.rect.bottom + 340 < window.innerHeight;
  const popupTop = preferBelow
    ? Math.min(selection.rect.bottom + 10, window.innerHeight - 340)
    : Math.max(8, selection.rect.top - 10 - 320);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-black/10 dark:border-white/10 p-3 sm:p-4"
      style={{
        top: popupTop,
        left: popupLeft,
        width: popupWidth,
      }}
    >
      {submitted ? (
        <div className="text-center py-3">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm font-semibold">Koreksi diterapkan!</p>
          <p className="text-xs opacity-60 mt-1">Perubahan langsung terlihat</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              💡 Saran Koreksi
            </div>
            <button
              onClick={() => setSelection(null)}
              className="text-xs opacity-40 hover:opacity-100"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>

          {/* Selected text display */}
          <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1">
              Teks asli ({wordCount} kata, {charCount} huruf)
            </div>
            <div className="text-xs sm:text-sm line-through decoration-red-400 decoration-2 leading-relaxed max-h-16 overflow-y-auto">
              {selection.text}
            </div>
          </div>

          {/* Suggestion input */}
          <div className="mb-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-1 block">
              Koreksi
            </label>
            <textarea
              value={suggested}
              onChange={(e) => setSuggested(e.target.value)}
              placeholder={selection.text}
              rows={2}
              className="w-full px-2 py-1.5 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Note (optional) */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)"
            className="w-full mb-1.5 px-2 py-1.5 text-xs rounded-lg border border-black/5 dark:border-white/5 bg-black/3 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {/* Nickname */}
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nama kamu (opsional)"
            className="w-full mb-2 px-2 py-1.5 text-xs rounded-lg border border-black/5 dark:border-white/5 bg-black/3 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {/* Buttons — stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-1.5">
            <button
              onClick={() => setSelection(null)}
              className="sm:flex-1 py-2 text-xs font-medium rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            >
              Batal
            </button>
            <button
              onClick={() => setShowPerbaikan(true)}
              className="sm:flex-1 py-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
            >
              ✏️ Perbaiki Kata
            </button>
            <button
              onClick={onSubmit}
              disabled={!suggested.trim() || suggested.trim() === selection.text}
              className="sm:flex-1 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40"
            >
              ✓ Kirim
            </button>
          </div>
        </>
      )}

      {/* Perbaiki Kata modal */}
      <PerbaikanKataModal
        open={showPerbaikan}
        slug={novelSlug}
        initialDari={selection.text}
        nickname={nickname.trim()}
        onClose={() => setShowPerbaikan(false)}
        onSaved={() => {
          onPerbaikanSaved();
        }}
      />
    </div>
  );
}