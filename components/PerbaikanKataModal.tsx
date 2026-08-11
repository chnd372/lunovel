"use client";

import { useState, useEffect } from "react";
import { addPerbaikan, addPerbaikanShared } from "@/lib/perbaikanKata";

interface Props {
  open: boolean;
  slug: string;
  initialDari: string;
  nickname?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PerbaikanKataModal({
  open, slug, initialDari, nickname = "", onClose, onSaved,
}: Props) {
  const [dari, setDari] = useState("");
  const [ke, setKe] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  // Sync from parent when initialDari changes or modal opens
  useEffect(() => {
    if (open) {
      setDari(initialDari || "");
      setKe("");
      setCaseSensitive(false);
      }
  }, [open, initialDari]);

  async function handleSave() {
    if (!dari.trim() || !ke.trim()) return;
    if (dari.trim() === ke.trim()) return;

    // 1. Optimistic Update: Save locally instantly
    try {
      addPerbaikan(slug, {
        dari: dari.trim(),
        ke: ke.trim(),
        caseSensitive,
        by: nickname?.trim() || "anon",
      });
    } catch (err) {
      console.error("Local save error:", err);
    }

    // 2. Instantly notify parent to close modal and apply changes to DOM
    onSaved?.();

    // 3. Fire-and-forget sync to Vercel KV in background
    // Since modal is already closed, user never feels any delay or hang!
    const payload = {
      dari: dari.trim(),
      ke: ke.trim(),
      caseSensitive,
      by: nickname?.trim() || "anon",
    };
    
    // Call API in background asynchronously
    fetch(`/api/perbaikan/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn("Background perbaikan sync failed:", err);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ganti Teks"
        className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-5 text-white"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">✏️</span>
            <span className="font-bold text-sm tracking-wide uppercase text-neutral-300">Ganti Teks</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors text-xl leading-none"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-700 mb-4" />

        {/* Field: Teks Asli */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5 tracking-wider">
            Teks Asli
          </label>
          <input
            type="text"
            value={dari}
            onChange={(e) => setDari(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-neutral-800 border border-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-white placeholder:text-neutral-500 font-mono transition-colors"
            placeholder="Teks/frasa yang ingin diganti..."
            autoComplete="off"
          />
        </div>

        {/* Field: Kata Pengganti */}
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5 tracking-wider">
            Diganti Dengan
          </label>
          <input
            type="text"
            value={ke}
            onChange={(e) => setKe(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-neutral-800 border border-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-white placeholder:text-neutral-500 font-mono transition-colors"
            placeholder="Kata/frasa pengganti..."
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSave(); }}
          />
        </div>

        {/* Checkbox: Case Sensitive */}
        <label className="flex items-center gap-3 mb-5 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-700 peer-checked:bg-blue-500 rounded-full transition-colors duration-200" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
          <div>
            <span className="text-sm text-neutral-200 font-medium group-hover:text-white transition-colors">
              Case Sensitive
            </span>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {caseSensitive ? "Huruf besar/kecil dibedakan" : "Huruf besar/kecil diabaikan"}
            </p>
          </div>
        </label>

        {/* Divider */}
        <div className="border-t border-neutral-700 mb-4" />

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all border border-neutral-700"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!dari.trim() || !ke.trim() || dari.trim() === ke.trim()}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-900/30"
          >
            ✓ Simpan
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-neutral-600 mt-3">
          Esc untuk batal · Enter untuk simpan · Berlaku di semua bab
        </p>
      </div>
    </>
  );
}
