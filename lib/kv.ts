/**
 * Vercel KV (Upstash Redis) client wrapper.
 * Used for comment storage when KV env vars are set.
 *
 * Falls back gracefully to null when not configured — the API route
 * will then try Supabase, and finally a dev-only file fallback.
 */
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasKV = Boolean(url && token);

export const kv: Redis | null = hasKV
  ? new Redis({
      url: url!,
      token: token!,
    })
  : null;

/** Log once on first call so we can tell which backend is active in production */
let _logged = false;
export function logBackendOnce(label: string) {
  if (_logged) return;
  _logged = true;
  if (typeof console !== "undefined") {
    console.log(`[comments] using backend: ${label}`);
  }
}