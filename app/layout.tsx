import "./globals.css";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import { ThemeScript } from "@/components/Navbar";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Lunovel";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lunovel.vercel.app";
const tagline = "Baca novel gratis, online. Terjemahan & original, update setiap hari.";

// Single source of truth for the brand image (used by every page that doesn't
// have a more specific cover). Pages override this in their own generateMetadata.
const defaultOgImage = {
  url: "/og-default.png",
  width: 1200,
  height: 630,
  alt: `${siteName} — ${tagline}`,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Baca Novel Gratis Online`,
    template: `%s · ${siteName}`,
  },
  description: tagline,
  keywords: ["novel", "baca novel", "novel terjemahan", "novel Indonesia", "xianxia", "fantasi", "web novel", "novel online gratis"],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  applicationName: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName,
    title: `${siteName} - Baca Novel Gratis Online`,
    description: tagline,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Baca Novel Gratis Online`,
    description: tagline,
    images: [defaultOgImage.url],
  },
  alternates: {
    canonical: siteUrl,
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
