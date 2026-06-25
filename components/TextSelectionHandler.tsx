"use client";

import { useState, useRef, useEffect } from "react";
import { saveCorrection, getPendingCount, type Correction } from "@/lib/corrections";

interface Props {
  novelId: string;
  novelSlug: string;
  chapterId: string;
  chapterNumber: number;
  contentRef: React.RefObject<HTMLDivElement>;
}

/**
 * Handles text selection in the reader content area.
 * When user selects text, shows a popup to submit a correction suggestion.
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
  const [submitted, setSubmitted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Listen for text selection
  useEffect(() => {
    function onMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        // Small delay to prevent flicker when clicking popup
        setTimeout(() => {
          if (!popupRef.current?.contains(document.activeElement)) {
            setSelection(null);
          }
        }, 200);
        return;
      }

      const text = sel.toString().trim();
      if (!text || text.length < 1 || text.length > 100) return;

      // Get context (40 chars before + after)
      const range = sel.getRangeAt(0);
      const container = contentRef.current;
      if (!container || !container.contains(range.commonAncestorContainer)) return;

      const fullText = container.textContent || "";
      const startOffset = Math.max(0, range.startOffset - 40);
      const endOffset = Math.min(fullText.length, range.endOffset + 40);
      const context = fullText.slice(startOffset, endOffset);

      // Position popup near selection
      const rect = range.getBoundingClientRect();
      setSelection({ text, context, rect });
      setSuggested(text); // pre-fill with original
      setSubmitted(false);
    }

    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [contentRef]);

  function onSubmit() {
    if (!selection || !suggested.trim() || suggested.trim() === selection.text) return;

    saveCorrection({
      novel_id: novelId,
      novel_slug: novelSlug,
      chapter_id: chapterId,
      chapter_number: chapterNumber,
      original: selection.text,
      suggested: suggested.trim(),
      context: selection.context,
      suggested_by: nickname.trim() || "anonymous",
    });

    setSubmitted(true);
    setTimeout(() => setSelection(null), 1500);
  }

  if (!selection) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-black/10 dark:border-white/10 p-3 w-72"
      style={{
        top: selection.rect.bottom + 8,
        left: Math.min(selection.rect.left, window.innerWidth - 300),
      }}
    >
      {submitted ? (
        <div className="text-center py-2">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-sm font-medium">Saran koreksi terkirim!</p>
          <p className="text-xs opacity-60 mt-1">Menunggu review admin</p>
        </div>
      ) : (
        <>
          <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
            💡 Saran Koreksi
          </div>
          <div className="mb-2 text-xs opacity-70">
            <span className="line-through decoration-red-500">{selection.text}</span>
            <span className="mx-1">→</span>
            <span className="text-emerald-500 font-medium">{suggested || "..."}</span>
          </div>
          <input
            type="text"
            value={suggested}
            onChange={(e) => setSuggested(e.target.value)}
            placeholder="Kata/phrase yang benar..."
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent mb-2"
            autoFocus
          />
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Nama (opsional)"
            className="w-full px-2 py-1 text-xs rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setSelection(null)}
              className="flex-1 py-1.5 text-xs rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            >
              Batal
            </button>
            <button
              onClick={onSubmit}
              disabled={!suggested.trim() || suggested.trim() === selection.text}
              className="flex-1 py-1.5 text-xs rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40"
            >
              Kirim
            </button>
          </div>
        </>
      )}
    </div>
  );
}
