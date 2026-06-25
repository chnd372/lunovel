"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const hasSupabase = !!supabase;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Login berhasil! Mengarahkan...");
      setTimeout(() => (window.location.href = "/profile"), 800);
    }
  }

  async function onSignup() {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  if (!hasSupabase) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-bold">Login belum aktif</h1>
        <p className="text-sm opacity-80">
          Untuk aktifkan bookmark & history yang tersimpan di cloud, setup Supabase dulu.
        </p>
        <p className="text-xs opacity-60">
          Lihat <code className="px-1 bg-black/10 dark:bg-white/10 rounded">supabase/schema.sql</code> & set
          <code className="px-1 bg-black/10 dark:bg-white/10 rounded ml-1">NEXT_PUBLIC_SUPABASE_URL</code>
          di <code className="px-1 bg-black/10 dark:bg-white/10 rounded">.env</code>.
        </p>
        <p className="text-xs opacity-60">
          Bookmark & history lo tetep jalan via localStorage — buka di device yang sama ya.
        </p>
        <Link href="/" className="inline-block text-accent hover:underline">
          ← Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Masuk ke Lunovel</h1>
      <form onSubmit={onLogin} className="space-y-3 bg-card-light dark:bg-card-dark p-6 rounded-xl border border-black/5 dark:border-white/5">
        <div>
          <label className="text-xs font-semibold opacity-70 block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70 block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("berhasil") ? "text-emerald-500" : "text-red-500"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Masuk"}
        </button>
        <p className="text-xs text-center opacity-60">
          Belum punya akun? Daftar otomatis saat pertama kali login.
        </p>
      </form>
    </div>
  );
}
