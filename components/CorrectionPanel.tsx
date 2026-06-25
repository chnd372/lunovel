"use client";

import { useState, useEffect } from "react";
import { getCorrections, deleteCorrection, type Correction } from "@/lib/corrections";

interface Props {
  novelId: string;
  novelSlug: string;
}

export default function CorrectionPanel({ novelId, novelSlug }: Props) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  function refresh() {
    setCorrections(getCorrections(novelId));
  }

  useEffect(() => { refresh(); }, [novelId]);

  const filtered = corrections.filter((c) => !filter || c.status === filter);
  const totalCount = corrections.length;

  function handleDelete(id: string) {
    deleteCorrection(id);
    refresh();
  }

  function handleDeleteAll() {
    corrections.forEach((c) => deleteCorrection(c.id));
    refresh();
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="px-3 py-1.5 text-sm rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition flex items-center gap-1.5"
      >
        <span>📝</span>
        <span>Koreksi ({totalCount})</span>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
        <h3 className="font-bold text-base flex items-center gap-2">
          📝 Koreksi Terpasang
          <span className="text-xs opacity-60 font-normal">
            ({totalCount} total — auto-apply)
          </span>
        </h3>
        <button onClick={() => setExpanded(false)} className="text-xl opacity-50 hover:opacity-100">×</button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 p-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
        {(["", "approved", "rejected"] as const).map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-xs rounded-full transition ${
              filter === f
                ? "bg-accent text-white"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            }`}
          >
            {f === "" ? "📋 Semua" : f === "approved" ? "☑️ Terpasang" : "🧹 Dihapus"}
          </button>
        ))}
        <button
          onClick={handleDeleteAll}
          className="ml-auto px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
        >
          🗑 Hapus Semua
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm opacity-60">
            {filter ? "Tidak ada koreksi" : "Belum ada koreksi"}
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="p-3 flex items-start gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              <div className="shrink-0 text-lg">
                {c.status === "approved" ? "☑️" : "🗑️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span className="font-mono text-xs opacity-60">Ch {c.chapter_number}</span>
                  <span className="line-through decoration-red-400 decoration-2 text-red-600 dark:text-red-400">
                    {c.original}
                  </span>
                  <span className="opacity-40">→</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {c.suggested}
                  </span>
                </div>
                <div className="text-[11px] opacity-50 line-clamp-1 font-mono">
                  ...{c.context}...
                </div>
                <div className="text-[11px] opacity-40 mt-1">
                  oleh {c.suggested_by} · {new Date(c.created_at).toLocaleString("id-ID")}
                </div>
              </div>
              <div className="shrink-0 flex gap-1">
                {c.status === "approved" && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-red-500"
                    title="Hapus koreksi (rollback)"
                  >🗑</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {totalCount > 0 && (
        <div className="p-3 border-t border-black/5 dark:border-white/5 flex justify-end">
          <button
            onClick={handleDeleteAll}
            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition"
          >
            🗑 Hapus Semua Koreksi
          </button>
        </div>
      )}
    </div>
  );
}
