"use client";

import { useState, useEffect } from "react";
import { getCorrections, updateCorrectionStatus, deleteCorrection, applyCorrections, type Correction } from "@/lib/corrections";

interface Props {
  novelId: string;
  novelSlug: string;
  onApply?: (applied: Correction[]) => void;
}

const statusIcon: Record<string, string> = {
  pending: "🟡",
  approved: "🟢",
  rejected: "🔴",
};

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function CorrectionPanel({ novelId, novelSlug, onApply }: Props) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);

  function refresh() {
    setCorrections(getCorrections(novelId));
  }

  useEffect(() => { refresh(); }, [novelId]);

  const filtered = corrections.filter((c) => !filter || c.status === filter);
  const pendingCount = corrections.filter((c) => c.status === "pending").length;
  const approvedCount = corrections.filter((c) => c.status === "approved").length;

  async function handleApprove(id: string) {
    updateCorrectionStatus(id, "approved");
    refresh();
  }

  function handleReject(id: string) {
    updateCorrectionStatus(id, "rejected");
    refresh();
  }

  function handleDelete(id: string) {
    deleteCorrection(id);
    refresh();
  }

  async function handleApplyAll() {
    setApplying(true);
    // This will trigger a re-render with corrections applied
    // The parent component should handle the actual text replacement
    const approved = corrections.filter((c) => c.status === "approved");
    if (onApply) onApply(approved);
    setApplying(false);
  }

  function handleApproveAll() {
    corrections
      .filter((c) => c.status === "pending")
      .forEach((c) => updateCorrectionStatus(c.id, "approved"));
    refresh();
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(true)}
          className="px-3 py-1.5 text-sm rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition flex items-center gap-1.5"
        >
          {pendingCount > 0 ? (
            <>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
              <span>Koreksi Pending</span>
            </>
          ) : (
            <>
              <span>📝</span>
              <span>Koreksi ({corrections.length})</span>
            </>
          )}
        </button>
        {approvedCount > 0 && (
          <button
            onClick={handleApplyAll}
            disabled={applying}
            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            {applying ? "Menerapkan..." : `Terapkan ${approvedCount} koreksi`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
        <h3 className="font-bold text-base flex items-center gap-2">
          📝 Antrian Koreksi
          <span className="text-xs opacity-60 font-normal">
            ({corrections.length} total, {pendingCount} pending, {approvedCount} approved)
          </span>
        </h3>
        <button onClick={() => setExpanded(false)} className="text-xl opacity-50 hover:opacity-100">×</button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 p-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
        {(["pending", "approved", "rejected", ""] as const).map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-xs rounded-full transition ${
              filter === f
                ? "bg-accent text-white"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            }`}
          >
            {f ? statusLabel[f] : "Semua"}
          </button>
        ))}
        {pendingCount > 0 && (
          <button
            onClick={handleApproveAll}
            className="ml-auto px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition"
          >
            ✅ Setujui Semua
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-black/5 dark:divide-white/5">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm opacity-60">
            {filter ? `Tidak ada koreksi ${statusLabel[filter]?.toLowerCase()}` : "Belum ada koreksi"}
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="p-3 flex items-start gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              <div className="shrink-0 text-lg">{statusIcon[c.status]}</div>
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
                {c.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(c.id)}
                      className="p-1 rounded hover:bg-emerald-500/10 text-emerald-500"
                      title="Setujui"
                    >✓</button>
                    <button
                      onClick={() => handleReject(c.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-500"
                      title="Tolak"
                    >✗</button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-30 hover:opacity-60"
                  title="Hapus"
                >🗑</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer with apply button */}
      {approvedCount > 0 && (
        <div className="p-3 border-t border-black/5 dark:border-white/5 flex justify-end">
          <button
            onClick={handleApplyAll}
            disabled={applying}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-500/90 disabled:opacity-50"
          >
            {applying ? "⏳ Menerapkan..." : `🚀 Terapkan ${approvedCount} Koreksi ke Semua Chapter`}
          </button>
        </div>
      )}
    </div>
  );
}
