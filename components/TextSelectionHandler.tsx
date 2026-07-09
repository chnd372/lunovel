"use client";

import { useState, useRef, useEffect } from "react";
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
 * Supports multi-word/phrase selection.
 * When user selects text, shows a popup near the selection to submit a correction.
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
  const popupRef = useRef<HTMLDivElement>(null);

  // Listen for text selection (mouseup + touchend)
  useEffect(() => {
    function onSelectionEnd() {
      // Small delay to let the browser finalize selection
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
          // Don't dismiss if user is interacting with popup
          if (!popupRef.current?.contains(document.activeElement)) {
            setSelection(null);
          }
          return;
        }

        const text = sel.toString().trim();
        // Allow 1-200 chars (multi-word phrases supported)
        if (!text || text.length < 1 || text.length > 200) return;

        // Verify selection is inside the content area
        const range = sel.getRangeAt(0);
        const container = contentRef.current;
        if (!container || !container.contains(range.commonAncestorContainer)) return;

        // Get broader context (60 chars before + after) for matching
        const fullText = container.textContent || "";
        const startOffset = Math.max(0, range.startOffset - 60);
        const endOffset = Math.min(fullText.length, range.endOffset + 60);
        const context = fullText.slice(startOffset, endOffset);

        // Position popup near selection
        const rect = range.getBoundingClientRect();
        setSelection({ text, context, rect });
        setSuggested("");  // Don't pre-fill — let user type the correction
        setNote("");
        setSubmitted(false);
      }, 150);
    }

    document.addEventListener("mouseup", onSelectionEnd);
    document.addEventListener("touchend", onSelectionEnd);
    return () => {
      document.removeEventListener("mouseup", onSelectionEnd);
      document.removeEventListener("touchend", onSelectionEnd);
    };
  }, [contentRef]);

  function onSubmit() {
    if (!selection || !suggested.trim()) return;
    if (suggested.trim() === selection.text) return; // No change

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

  if (!selection) return null;

  const wordCount = selection.text.split(/\s+/).length;
  const charCount = selection.text.length;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-black/10 dark:border-white/10 p-4 w-80"
      style={{
        top: Math.min(selection.rect.bottom + 10, window.innerHeight - 320),
        left: Math.max(8, Math.min(selection.rect.left, window.innerWidth - 330)),
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
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-accent">
              💡 Saran Koreksi
            </div>
            <button
              onClick={() => setSelection(null)}
              className="text-xs opacity-40 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          {/* Selected text display */}
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1">
              Teks asli ({wordCount} kata, {charCount} huruf)
            </div>
            <div className="text-sm line-through decoration-red-400 decoration-2 leading-relaxed">
              {selection.text.length > 120
                ? selection.text.slice(0, 120) + "…"
                : selection.text}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center mb-2">
            <span className="text-accent text-lg">↓</span>
          </div>

          {/* Suggestion input */}
          <div className="mb-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mb-1 block">
              Koreksi / Perbaikan
            </label>
            <textarea
              value={suggested}
              onChange={(e) => setSuggested(e.target.value)}
              placeholder={selection.text}
              rows={Math.min(4, Math.max(2, Math.ceil(selection.text.length / 40)))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-900/20 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              autoFocus
            />
          </div>

          {/* Note (optional) */}
          <div className="mb-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional, mis. 'typo' / 'miskonsepsi')"
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-black/5 dark:border-white/5 bg-black/3 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Nickname */}
          <div className="mb-3">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nama kamu (opsional)"
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-black/5 dark:border-white/5 bg-black/3 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelection(null)}
              className="flex-1 py-2 text-xs font-medium rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            >
              Batal
            </button>
            <button
              onClick={() => setShowPerbaikan(true)}
              className="flex-1 py-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
              title="Find & replace untuk semua chapter novel ini (tersimpan lokal)"
            >
              ✏️ Perbaiki Kata
            </button>
            <button
              onClick={onSubmit}
              disabled={!suggested.trim() || suggested.trim() === selection.text}
              className="flex-1 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40 transition-opacity"
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
        onClose={() => setShowPerbaikan(false)}
        onSaved={() => {
          // Notify Reader to re-render with new find/replace rules
          window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
            detail: { slug: novelSlug },
          }));
        }}
      />
    </div>
  );
}
