"use client";

import { useState, useEffect } from "react";
import {
  usePerbaikan, syncSharedRules,
  removePerbaikanShared, clearPerbaikanShared,
} from "@/lib/perbaikanKata";
import type { Novel } from "@/lib/types";

interface Props {
  novel: Novel;
}

/**
 * Per-novel persistent find & replace manager.
 * Edit/remove existing rules, add new ones manually, see live counts.
 * All changes are shared with every reader of this novel (via Vercel KV).
 */
export default function PerbaikanKataManager({ novel }: Props) {
  const { list, add, update, remove, clear, sync } = usePerbaikan(novel.slug);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editDari, setEditDari] = useState("");
  const [editKe, setEditKe] = useState("");
  const [editCS, setEditCS] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addDari, setAddDari] = useState("");
  const [addKe, setAddKe] = useState("");
  const [addCS, setAddCS] = useState(false);
  const [backend, setBackend] = useState<"kv" | "none" | "unknown">("unknown");

  useEffect(() => {
    setHydrated(true);
    syncSharedRules(novel.slug)
      .then((res) => {
        setBackend(res.backend);
        sync();
      })
      .catch(() => setBackend("none"));
  }, [novel.slug, sync]);

  function startEdit(i: number) {
    const r = list[i];
    setEditing(i);
    setEditDari(r.dari);
    setEditKe(r.ke);
    setEditCS(r.caseSensitive);
  }

  async function saveEdit() {
    if (editing === null) return;
    if (!editDari.trim() || !editKe) return;
    update(editing, { dari: editDari.trim(), ke: editKe, caseSensitive: editCS });
    setEditing(null);
    notifyChange();
    // Push updated rule to shared store
    try {
      await fetch(`/api/perbaikan/${encodeURIComponent(novel.slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dari: editDari.trim(),
          ke: editKe,
          caseSensitive: editCS,
        }),
      });
    } catch {}
  }

  async function submitAdd(e?: React.FormEvent) {
    e?.preventDefault();
    if (!addDari.trim() || !addKe) return;
    add({ dari: addDari.trim(), ke: addKe, caseSensitive: addCS });
    setAddDari("");
    setAddKe("");
    setAddCS(false);
    setShowAdd(false);
    notifyChange();
    try {
      const res = await fetch(`/api/perbaikan/${encodeURIComponent(novel.slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dari: addDari.trim(),
          ke: addKe,
          caseSensitive: addCS,
        }),
      });
      if (res.ok) setBackend("kv");
    } catch {}
  }

  function notifyChange() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("lunovel:perbaikan-changed", {
      detail: { slug: novel.slug },
    }));
  }

  async function doRemove(idx: number) {
    await removePerbaikanShared(novel.slug, idx);
    sync();
    notifyChange();
  }

  async function confirmClear() {
    if (typeof window === "undefined") return;
    if (!window.confirm(`Hapus semua ${list.length} perbaikan untuk "${novel.title}"?`)) return;
    await clearPerbaikanShared(novel.slug);
    clear();
    notifyChange();
  }

  if (!hydrated) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats + actions bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm opacity-70 flex items-center gap-2 flex-wrap">
          {list.length === 0 ? (
            <span>Belum ada perbaikan tersimpan</span>
          ) : (
            <span>
              <strong className="text-base font-bold text-accent">{list.length}</strong>{" "}
              kata perbaikan tersimpan
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            backend === "kv"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : backend === "none"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "bg-black/5 dark:bg-white/10 opacity-60"
          }`}>
            {backend === "kv" ? "🌐 dibagikan ke semua" : backend === "none" ? "⚠️ hanya lokal" : "..."}
          </span>
        </div>
        <div className="flex gap-2">
          {list.length > 0 && (
            <button
              onClick={confirmClear}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
            >
              🗑️ Hapus Semua
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90"
          >
            {showAdd ? "✕ Batal" : "+ Tambah Manual"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={submitAdd}
          className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-3 bg-black/[0.02] dark:bg-white/[0.02]"
        >
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
            Tambah Perbaikan Manual
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
            <div>
              <label className="text-[10px] opacity-60 block mb-1">Kata Asli</label>
              <input
                type="text"
                value={addDari}
                onChange={(e) => setAddDari(e.target.value)}
                placeholder="Yang salah..."
                maxLength={500}
                className="w-full px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="text-center pb-2 text-accent">→</div>
            <div>
              <label className="text-[10px] opacity-60 block mb-1">Pengganti</label>
              <input
                type="text"
                value={addKe}
                onChange={(e) => setAddKe(e.target.value)}
                placeholder="Yang benar..."
                maxLength={500}
                className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              type="submit"
              disabled={!addDari.trim() || !addKe}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 disabled:opacity-40"
            >
              💾 Simpan
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={addCS}
              onChange={(e) => setAddCS(e.target.checked)}
              className="w-3.5 h-3.5 accent-accent"
            />
            <span>Case Sensitive (huruf besar/kecil harus persis sama)</span>
          </label>
        </form>
      )}

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 p-10 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-medium text-sm">Belum ada perbaikan kata</p>
          <p className="text-xs opacity-60 mt-1.5 max-w-sm mx-auto">
            Buka chapter manapun, blok/select kata yang salah, klik tombol
            <span className="mx-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
              ✏️ Perbaiki Kata
            </span>
            untuk menambah otomatis.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {list.map((rule, i) => {
              const isEditing = editing === i;
              return (
                <div
                  key={`${rule.dari}-${i}`}
                  className="px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        <input
                          value={editDari}
                          onChange={(e) => setEditDari(e.target.value)}
                          className="px-2.5 py-1.5 text-sm rounded border border-red-200 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <div className="text-center text-accent">→</div>
                        <input
                          value={editKe}
                          onChange={(e) => setEditKe(e.target.value)}
                          className="px-2.5 py-1.5 text-sm rounded border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10 focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={editCS}
                            onChange={(e) => setEditCS(e.target.checked)}
                            className="w-3.5 h-3.5 accent-accent"
                          />
                          <span>Case Sensitive</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(null)}
                            className="px-3 py-1 text-xs rounded bg-black/5 dark:bg-white/10 hover:bg-black/10"
                          >
                            Batal
                          </button>
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 sm:gap-3 items-center">
                        <div className="font-mono text-sm line-through decoration-red-400 decoration-2 truncate">
                          {rule.dari}
                        </div>
                        <div className="text-accent">→</div>
                        <div className="font-mono text-sm font-medium truncate text-emerald-600 dark:text-emerald-400">
                          {rule.ke}
                        </div>
                        <div className="text-[10px] opacity-50 font-mono">
                          {rule.caseSensitive ? "Aa" : "aa"}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(i)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-sm"
                          aria-label="Edit"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => doRemove(i)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-sm"
                          aria-label="Hapus"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}