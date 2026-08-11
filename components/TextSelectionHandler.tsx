"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import PerbaikanKataModal from "@/components/PerbaikanKataModal";

interface Props {
  novelId: string;
  novelSlug: string;
  chapterId: string;
  chapterNumber: number;
  contentRef: React.RefObject<HTMLDivElement>;
}

export default function TextSelectionHandler({
  novelId, novelSlug, chapterId, chapterNumber, contentRef,
}: Props) {
  const [selection, setSelection] = useState<{
    text: string;
    context: string;
    rect: DOMRect;
  } | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>("");

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const text = sel.toString().trim();
    if (!text || text.length < 1 || text.length > 300) return null;

    const range = sel.getRangeAt(0);
    const container = contentRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return null;

    // Get context safely
    const fullText = container.textContent || "";
    const startOffset = Math.max(0, range.startOffset - 60);
    const endOffset = Math.min(fullText.length, range.endOffset + 60);
    const context = fullText.slice(startOffset, endOffset);

    return { text, context, rect: range.getBoundingClientRect() };
  }, [contentRef]);

  useEffect(() => {
    function onChange() {
      // Ignore if modal is already open
      if (showModal) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const result = checkSelection();
        if (!result) {
          // Hide button if selection is lost
          if (lastTextRef.current) setSelection(null);
          lastTextRef.current = "";
          return;
        }
        
        // If same text, don't flicker
        if (result.text === lastTextRef.current && selection) {
            // Update rect just in case scroll happened
            setSelection({ ...selection, rect: result.rect });
            return;
        }
        
        lastTextRef.current = result.text;
        setSelection(result);
      }, 300); // slightly longer debounce for mobile native menu to settle
    }

    document.addEventListener("selectionchange", onChange);
    document.addEventListener("touchend", onChange);

    return () => {
      document.removeEventListener("selectionchange", onChange);
      document.removeEventListener("touchend", onChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [checkSelection, showModal, selection]);

  // When saved, tell Reader to re-render
  function onPerbaikanSaved() {
    setShowModal(false);
    setSelection(null);
    lastTextRef.current = "";
    // Clear browser selection so the button doesn't pop right back
    window.getSelection()?.removeAllRanges();
    
    try {
      window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
        detail: { slug: novelSlug },
      }));
    } catch {}
  }

  return (
    <>
      {/* 1. Floating Pencil Button — fixed bottom-right, never blocks copy menu */}
      {selection && !showModal && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(true);
          }}
          className="fixed z-50 bottom-24 right-4 sm:bottom-8 sm:right-6 flex items-center gap-1.5 px-3 py-2 bg-neutral-900 dark:bg-neutral-800 text-white border border-neutral-700 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm font-medium"
          aria-label="Ganti Teks"
          title="Ganti Teks"
        >
          ✏️ <span className="text-xs">Ganti</span>
        </button>
      )}

      {/* 2. Modal Dialog (Dark Mode) - opens only when pencil is clicked */}
      <PerbaikanKataModal
        open={showModal}
        slug={novelSlug}
        initialDari={selection?.text || ""}
        onClose={() => {
            setShowModal(false);
            window.getSelection()?.removeAllRanges();
        }}
        onSaved={onPerbaikanSaved}
      />
    </>
  );
}
