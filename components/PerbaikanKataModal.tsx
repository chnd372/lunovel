"use client";

import { useState, useEffect } from "react";
import { addPerbaikanShared } from "@/lib/perbaikanKata";

interface Props {
  open: boolean;
  slug: string;
  initialDari: string;
  nickname?: string;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * "Perbaiki Kata" personal find-and-replace modal.
 * Pre-fills "Kata Asli" with the user's selected text.
 * Persists locally (localStorage) AND shared (Vercel KV via API).
 */
export default function PerbaikanKataModal({
  open, slug, initialDari, nickname, onClose, onSaved,
}: Props) {
  const [dari, setDari] = useState(initialDari);
  const [ke, setKe] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharedOk, setSharedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when opening with new selected text
  useEffect(() => {
    if (open) {
      setDari(initialDari);
      setKe("");
      setCaseSensitive(false);
      setSaved(false);
      setSharedOk(false);
      setError(null);
    }
  }, [open, initialDari]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmedDari = dari.trim();
    const trimmedKe = ke;
    if (!trimmedDari) {
      setError("Kata Asli tidak boleh kosong");
      return;
    }
    if (trimmedDari === trimmedKe) {
      setError("Kata Pengganti harus berbeda dari Kata Asli");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await addPerbaikanShared(slug, {
        dari: trimmedDari,
        ke: trimmedKe,
        caseSensitive,
        by: nickname || undefined,
      });
      setSharedOk(res.shared);
      setSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 900);
    } catch (err) {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const dariLen = dari.length;
  const keLen = ke.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>✏️</span>
              <span>Perbaiki Kata</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                dibagikan
              </span>
            </h3>
            <p className="text-xs opacity-60 mt-0.5">
              Berlaku untuk semua chapter novel ini & semua pembaca
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-lg opacity-60 hover:opacity-100"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {saved ? (
          <div className="px-5 py-10 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold">Tersimpan!</p>
            <p className="text-xs opacity-60 mt-1">
              {sharedOk
                ? "Tersimpan lokal & dibagikan ke semua pembaca"
                : "Tersimpan lokal (offline — akan sync saat online)"}
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Kata Asli */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-1.5">
                Kata Asli
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dari}
                  onChange={(e) => { setDari(e.target.value); setError(null); }}
                  placeholder="Kata yang ingin diganti..."
                  maxLength={500}
                  className="w-full px-3 py-2.5 pr-12 text-sm rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-mono">
                  {dariLen}/500
                </span>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex justify-center -my-1">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                ↓
              </div>
            </div>

            {/* Kata Pengganti */}
            <div>
              <label className="text-xs font-semibold opacity-70 block mb-1.5">
                Kata Pengganti
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ke}
                  onChange={(e) => { setKe(e.target.value); setError(null); }}
                  placeholder="Diganti menjadi..."
                  maxLength={500}
                  autoFocus
                  className="w-full px-3 py-2.5 pr-12 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-mono">
                  {keLen}/500
                </span>
              </div>
            </div>

            {/* Case Sensitive checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">Case Sensitive</div>
                <div className="text-[11px] opacity-60">
                  {caseSensitive
                    ? "Hanya ganti teks dengan huruf besar/kecil persis sama"
                    : "Ganti semua kemunculan, besar kecil diabaikan"}
                </div>
              </div>
            </label>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs">
                ⚠️ {error}
              </div>
            )}

            {/* Info */}
            <div className="text-[11px] opacity-60 leading-relaxed">
              💾 Tersimpan di server — <strong>semua pembaca novel ini</strong> akan
              melihat perbaikan kamu otomatis. Buka halaman{" "}
              <span className="font-semibold">Daftar Perbaikan</span> untuk
              lihat, edit, atau hapus.
            </div>
          </div>
        )}

        {/* Footer */}
        {!saved && (
          <div className="flex gap-2 px-5 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!dari.trim() || !ke || dari.trim() === ke}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40 transition-opacity"
            >
              💾 Simpan
            </button>
          </div>
        )}
      </form>
    </div>
  );
}