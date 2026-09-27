"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { addPerbaikan } from "@/lib/perbaikanKata";

interface Props {
  novelId: string;
  novelSlug: string;
  chapterId: string;
  chapterNumber: number;
  contentRef: React.RefObject<HTMLDivElement>;
}

export default function TextSelectionHandler({
  novelSlug, contentRef,
}: Props) {
  const [selection, setSelection] = useState<{
    text: string;
    context: string;
    rect: DOMRect;
  } | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [replacement, setReplacement] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>("");
  const isEditingRef = useRef(false);
  const selectionRef = useRef<typeof selection>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep refs in sync
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  useEffect(() => { selectionRef.current = selection; }, [selection]);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const text = sel.toString().trim();
    if (!text || text.length < 1 || text.length > 100) return null;

    const range = sel.getRangeAt(0);
    const container = contentRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return null;

    return { text, context: "", rect: range.getBoundingClientRect() };
  }, [contentRef]);

  useEffect(() => {
    function onChange() {
      if (isEditingRef.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const result = checkSelection();
        if (!result) {
          if (lastTextRef.current) setSelection(null);
          lastTextRef.current = "";
          return;
        }
        
        if (result.text === lastTextRef.current && selectionRef.current) {
            setSelection({ ...selectionRef.current, rect: result.rect });
            return;
        }
        
        lastTextRef.current = result.text;
        setSelection(result);
      }, 300);
    }

    document.addEventListener("selectionchange", onChange);
    document.addEventListener("touchend", onChange);

    return () => {
      document.removeEventListener("selectionchange", onChange);
      document.removeEventListener("touchend", onChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [checkSelection]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  function handleSave() {
    if (!selection) return;
    const dari = selection.text;
    const ke = replacement.trim();
    
    if (ke && ke !== dari) {
      try {
        addPerbaikan(novelSlug, {
          dari,
          ke,
          caseSensitive: false,
          by: "anon",
        });
      } catch (err) {}
      
      // Dispatch event for Reader to re-render instantly
      try {
        window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
          detail: { slug: novelSlug },
        }));
      } catch {}
    }

    // Reset
    setIsEditing(false);
    setSelection(null);
    setReplacement("");
    lastTextRef.current = "";
    window.getSelection()?.removeAllRanges();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setSelection(null);
      setReplacement("");
      lastTextRef.current = "";
      window.getSelection()?.removeAllRanges();
    }
  }

  if (!selection) return null;

  // Calculate position: above the selection
  const top = Math.max(10, selection.rect.top - (isEditing ? 60 : 50));
  const left = Math.max(10, Math.min(window.innerWidth - 220, selection.rect.left + (selection.rect.width / 2) - 100));

  return (
    <div
      className="fixed z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top, left }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {!isEditing ? (
        <button
          onClick={() => {
            setIsEditing(true);
            setReplacement(selection.text);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black/90 dark:bg-white/90 text-white dark:text-black rounded-full shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="text-sm font-bold">✏️ Edit</span>
          <span className="text-xs opacity-70 max-w-[100px] truncate">"{selection.text}"</span>
        </button>
      ) : (
        <div className="flex items-center gap-1.5 p-1.5 bg-black/90 dark:bg-white/90 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 dark:border-black/10 w-[240px]">
          <input
            ref={inputRef}
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ganti menjadi..."
            className="flex-1 bg-transparent text-white dark:text-black text-sm px-3 py-2 outline-none font-medium placeholder-white/30 dark:placeholder-black/30"
          />
          <button
            onClick={handleSave}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}