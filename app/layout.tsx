import "./globals.css";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import { ThemeScript } from "@/components/Navbar";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";
const tagline = "Baca novel gratis, online. Terjemahan & original, update setiap hari.";

export const metadata: Metadata = {
  title: { default: siteName, template: `%s · ${siteName}` },
  description: tagline,
  keywords: ["novel", "baca novel", "novel terjemahan", "novel Indonesia", "xianxia", "fantasi"],
  openGraph: {
    title: siteName,
    description: tagline,
    type: "website",
    locale: "id_ID",
    siteName,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ed4e08",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <footer className="border-t border-black/10 dark:border-white/10 py-6 text-center text-sm opacity-70">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <div>🌙 {siteName} · {new Date().getFullYear()} · {tagline}</div>
            <div className="text-xs opacity-60">
              Dibangun dengan Next.js + Vercel · 100% gratis · Bebas iklan
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
