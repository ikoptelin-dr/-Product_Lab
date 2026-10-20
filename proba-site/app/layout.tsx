import "@fontsource/cormorant-garamond/cyrillic-500.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/cyrillic-500-italic.css";
import "@fontsource/cormorant-garamond/latin-500-italic.css";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/cyrillic-500.css";
import "@fontsource/inter/latin-500.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { RevealObserver } from "@/components/interactive/RevealObserver";
import { meta } from "@/content/site";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: { default: meta.title, template: "%s — Proba Lab" },
  description: meta.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Proba Lab",
    title: meta.title,
    description: meta.description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Proba Lab" }],
  },
  twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: ["/og.png"] },
  icons: {
    icon: [{ url: "/brand/icon-32.png", sizes: "32x32" }, { url: "/brand/icon-512.png", sizes: "512x512" }],
    apple: "/brand/icon-180.png",
  },
  robots: siteConfig.robotsNoindex ? { index: false, follow: false } : { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
          Перейти к содержанию
        </a>
        {children}
        <RevealObserver />
        <CookieBanner ymId={siteConfig.ymId} />
      </body>
    </html>
  );
}
