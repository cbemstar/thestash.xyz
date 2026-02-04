import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { getAllTags, getResourceTypesWithCounts } from "@/lib/sanity.resource";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

/** Max tags to show in footer (avoid excessive links per Semrush). */
const FOOTER_TAGS_LIMIT = 28;

export const metadata: Metadata = {
  title: "The Stash | Dev & Design Resources",
  description:
    "Curated directory of dev and design resources: hand-picked tools, inspiration, courses, AI tools, and links for developers and designers. Browse by category or explore collections.",
  metadataBase: new URL(BASE_URL),
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tags, typesWithCounts] = await Promise.all([
    getAllTags(),
    getResourceTypesWithCounts(),
  ]);
  const footerTags = tags.slice(0, FOOTER_TAGS_LIMIT);
  const footerTypes = typesWithCounts.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();

  return (
    <html lang="en" className="dark grain" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} flex min-h-screen flex-col font-sans antialiased`}
        suppressHydrationWarning
      >
        {adsenseClientId && (
          <Script
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <Footer tags={footerTags} types={footerTypes} />
        </div>
        <CookieConsent />
      </body>
    </html>
  );
}
