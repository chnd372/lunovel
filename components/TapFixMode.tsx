"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { addPerbaikanShared, type PerbaikanKata } from "@/lib/perbaikanKata";
import PerbaikanKataModal from "@/components/PerbaikanKataModal";

interface Props {
  slug: string;
  contentRef: React.RefObject<HTMLDivElement>;
  nickname?: string;
}

/**
 * "Mode Perbaiki Kata" — toggle ON to enable tap-to-fix.
 *
 * ON  → tapping any word in the content area highlights it & opens the modal,
 *        pre-filled with that word.
 * OFF → reader behaves normally (native selection, popup, etc).
 *
 * Why a toggle, not piggybacking on text selection:
 *   On mobile (iOS Safari, Android Chrome) the native selection toolbar (Copy /
 *   Translate / Share) takes over after a tap-drag, which kills any custom UI
 *   we layer on top. Tapping without drag is the only gesture that doesn't
 *   trigger the system toolbar — so we use it as the explicit "I want to
 *   edit this word" signal.
 *
 * Word detection uses `document.caretRangeFromPoint(x, y)` (Chromium) /
 * `caretPositionFromPoint` (Safari/Firefox). Falls back to a simple text-node
 * walk if neither is available.
 */
export default function TapFixMode({ slug, contentRef, nickname }: Props) {
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const highlightRef = useRef<HTMLSpanElement | null>(null);

  // Persist toggle per-novel (so switching chapters doesn't lose it)
  useEffect(() => {
    try {
      const v = localStorage.getItem(`tapfix_${slug}`);
      if (v === "1") setActive(true);
    } catch {}
  }, [slug]);

  const toggle = useCallback(() => {
    setActive((cur) => {
      const next = !cur;
      try { localStorage.setItem(`tapfix_${slug}`, next ? "1" : "0"); } catch {}
      if (!next) removeHighlight();
      return next;
    });
  }, [slug]);

  // ESC to exit mode
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") toggle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, toggle]);

  // Tap handler — attached only when active
  useEffect(() => {
    if (!active) return;
    const el = contentRef.current;
    if (!el) return;

    function wordAtPoint(x: number, y: number): string | null {
      type CaretPos = { offsetNode: Node; offset: number };
      type CaretRange = { startContainer: Node; startOffset: number; endContainer: Node; endOffset: number; getBoundingClientRect: () => DOMRect; cloneRange: () => Range; insertNode?: (n: Node) => void };
      const doc = (document as any);
      let caret: CaretPos | CaretRange | null = null;
      if (typeof doc.caretRangeFromPoint === "function") {
        caret = doc.caretRangeFromPoint(x, y) as CaretRange;
      } else if (typeof doc.caretPositionFromPoint === "function") {
        caret = doc.caretPositionFromPoint(x, y) as CaretPos;
      }
      if (!caret) return null;

      const container = contentRef.current;
      if (!container) return null;

      // caretRangeFromPoint returns a Range; caretPositionFromPoint returns a position
      const range = (caret as CaretRange).cloneRange
        ? (caret as CaretRange).cloneRange()
        : (() => {
            const r = document.createRange();
            r.setStart((caret as CaretPos).offsetNode, (caret as CaretPos).offset);
            r.setEnd((caret as CaretPos).offsetNode, (caret as CaretPos).offset);
            return r;
          })();
      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return null;
      if (!container.contains(node)) return null;

      const text = node.textContent ?? "";
      const idx = range.startOffset;
      // Find word boundary around idx. CJK: any single char is a "word";
      // Latin: alphanumerics+underscore+hyphen.
      const CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;
      const WORD = /[A-Za-z0-9_'-]/;

      function expand(start: number, dir: -1 | 1): number {
        let i = start;
        while (i > 0 && i < text.length) {
          const ch = text[i + (dir === -1 ? -1 : 0)];
          if (CJK.test(ch) && dir === -1) {
            // For CJK, word = single char; stop unless we want multi-char (CJK pair)
            // Heuristic: if previous char was also CJK and right next to it, treat as 2-char word
            const prev = text[i - 1];
            if (i === start && prev && CJK.test(prev) && start - (i - 1) === 1) {
              i--; continue;
            }
            break;
          }
          if (WORD.test(ch)) { i += dir; continue; }
          break;
        }
        return i;
      }

      // Start position (handle both directions)
      let startIdx = idx, endIdx = idx;
      // Walk back
      if (idx > 0 && (WORD.test(text[idx - 1]) || CJK.test(text[idx - 1]))) {
        startIdx = expand(idx, -1);
      }
      // Walk forward
      if (idx < text.length && (WORD.test(text[idx]) || CJK.test(text[idx]))) {
        endIdx = expand(idx, 1);
      }

      // Trim whitespace/punctuation
      while (startIdx < endIdx && !WORD.test(text[startIdx]) && !CJK.test(text[startIdx])) startIdx++;
      while (endIdx > startIdx && !WORD.test(text[endIdx - 1]) && !CJK.test(text[endIdx - 1])) endIdx--;

      if (endIdx <= startIdx) return null;
      return text.slice(startIdx, endIdx).trim();
    }

    function highlightWord(word: string, x: number, y: number) {
      removeHighlight();
      const container = contentRef.current;
      if (!container) return;
      // Re-derive range for current word so we can scroll & flash
      const doc = (document as any);
      let caret: any = null;
      if (typeof doc.caretRangeFromPoint === "function") caret = doc.caretRangeFromPoint(x, y);
      else if (typeof doc.caretPositionFromPoint === "function") caret = doc.caretPositionFromPoint(x, y);
      if (!caret) return;
      const range = caret.cloneRange ? caret.cloneRange() : (() => {
        const r = document.createRange();
        r.setStart(caret.offsetNode, caret.offset); r.setEnd(caret.offsetNode, caret.offset);
        return r;
      })();
      const span = document.createElement("span");
      span.className = "tapfix-flash";
      span.style.cssText = "background:rgba(250,204,21,.55);outline:2px solid #f59e0b;border-radius:3px;transition:background 600ms;";
      try {
        range.surroundContents(span);
        highlightRef.current = span;
        // Fade out after a moment
        setTimeout(() => {
          if (span.parentNode) span.style.background = "transparent";
        }, 1200);
      } catch {
        // surroundContents fails when range crosses element boundaries — skip flash
      }
    }

    function removeHighlight() {
      if (highlightRef.current) {
        const span = highlightRef.current;
        const parent = span.parentNode;
        if (parent) {
          // Unwrap span, keep text content
          while (span.firstChild) parent.insertBefore(span.firstChild, span);
          parent.removeChild(span);
          parent.normalize();
        }
        highlightRef.current = null;
      }
    }

    function onTap(e: MouseEvent | TouchEvent) {
      // Only intercept direct taps on text within the content
      const target = e.target as Node;
      const container = contentRef.current;
      if (!container || !container.contains(target)) return;
      // Don't trigger on clicks inside the floating UI itself
      if ((e.target as HTMLElement).closest?.("[data-tapfix-ui]")) return;

      // Get coords from either mouse or touch event
      let x: number, y: number;
      if ("touches" in e) {
        const t = e.changedTouches?.[0] ?? (e as any).touches?.[0];
        if (!t) return;
        x = t.clientX; y = t.clientY;
      } else {
        x = (e as MouseEvent).clientX; y = (e as MouseEvent).clientY;
      }

      const word = wordAtPoint(x, y);
      if (!word) return;
      e.preventDefault();
      e.stopPropagation();
      highlightWord(word, x, y);
      setPending(word);
    }

    // Use click for desktop, touchend for mobile (more reliable than click on iOS for tap-to-detect)
    const onClick = (e: MouseEvent) => onTap(e);
    const onTouchEnd = (e: TouchEvent) => {
      // Wait one tick so we don't collide with native click firing
      setTimeout(() => onTap(e), 0);
    };

    el.addEventListener("click", onClick);
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("click", onClick);
      el.removeEventListener("touchend", onTouchEnd);
      removeHighlight();
    };
  }, [active, contentRef]);

  async function onModalSaved() {
    setPending(null);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
    // Re-render the chapter content (Reader listens for this event)
    window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
      detail: { slug },
    }));
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        data-tapfix-ui
        onClick={toggle}
        title={active ? "Matikan Mode Perbaiki Kata" : "Aktifkan Mode Perbaiki Kata (tap kata untuk edit)"}
        aria-label="Mode Perbaiki Kata"
        className={`fixed z-40 bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 select-none touch-manipulation ${
          active
            ? "bg-accent text-white scale-110 ring-4 ring-accent/30 animate-pulse"
            : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-black/10 dark:border-white/10 hover:scale-105"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        ✏️
      </button>

      {/* Active-mode hint banner */}
      {active && (
        <div
          data-tapfix-ui
          className="fixed z-30 bottom-36 right-4 sm:bottom-24 sm:right-6 max-w-xs px-3 py-2 rounded-lg bg-accent/95 text-white text-xs shadow-lg backdrop-blur-sm pointer-events-none"
        >
          👆 Tap kata untuk edit · ESC / ✏️ untuk keluar
        </div>
      )}

      {/* Saved toast */}
      {savedToast && (
        <div
          data-tapfix-ui
          className="fixed z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-2xl pointer-events-none"
        >
          ✅ Tersimpan & dibagikan ke semua
        </div>
      )}

      {/* Modal — only mounted when a word is pending */}
      <PerbaikanKataModal
        open={pending !== null}
        slug={slug}
        initialDari={pending ?? ""}
        nickname={nickname}
        onClose={() => setPending(null)}
        onSaved={onModalSaved}
      />
    </>
  );
}