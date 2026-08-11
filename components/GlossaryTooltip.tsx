"use client";

import { useState, useEffect } from "react";

interface Props {
  term: string;
  definition: string;
  onClose: () => void;
}

export default function GlossaryTooltip({ term, definition, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />
      
      {/* Tooltip Card */}
      <div className="fixed z-50 bottom-10 left-1/2 -translate-x-1/2 w-[90vw] max-w-sm p-4 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl text-white animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span>📚</span> Istilah Xianxia
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>
        
        <h3 className="text-sm font-bold capitalize text-neutral-100 font-serif mb-1">
          {term}
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed">
          {definition}
        </p>
      </div>
    </>
  );
}
