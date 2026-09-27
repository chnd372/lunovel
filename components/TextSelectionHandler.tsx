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
      
      try {
        window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
          detail: { slug: novelSlug },
        }));
      } catch {}
    }

    // Reset
    isEditingRef.current = false;
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
      isEditingRef.current = false;
      setIsEditing(false);
      setSelection(null);
      setReplacement("");
      lastTextRef.current = "";
      window.getSelection()?.removeAllRanges();
    }
  }

  if (!selection) return null;

  return (
    <div
      className="fixed z-[100] bottom-28 left-0 right-0 px-4 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div 
        className="pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {!isEditing ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              isEditingRef.current = true;
              if (debounceRef.current) clearTimeout(debounceRef.current);
              setIsEditing(true);
              setReplacement(selection.text);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-neutral-900 dark:bg-white/95 text-white dark:text-black rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-md border border-white/10 dark:border-black/10 hover:scale-105 active:scale-95 transition-transform mx-auto"
          >
            <span className="text-sm font-bold">✏️ Edit</span>
            <span className="text-xs opacity-70 max-w-[120px] truncate">"{selection.text}"</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2 p-3 bg-neutral-900/95 dark:bg-neutral-100/95 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl border border-white/10 dark:border-black/10 w-[90vw] max-w-[400px] mx-auto">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-white dark:text-black">Koreksi Cepat</span>
              <button onClick={() => { isEditingRef.current = false; setIsEditing(false); setSelection(null); }} className="text-white dark:text-black opacity-60 hover:opacity-100 px-2">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ganti "${selection.text}"...`}
                className="flex-1 bg-black/20 dark:bg-white/50 text-white dark:text-black text-sm px-4 py-2.5 rounded-xl outline-none font-medium placeholder-white/40 dark:placeholder-black/40 focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleSave}
                className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-accent text-white font-bold text-lg hover:bg-accent/90 active:scale-95 transition-all shadow-glow"
              >
                ✓
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}