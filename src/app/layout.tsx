import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { ConsentInitializer } from "@/components/ConsentInitializer";
import { Toaster } from "@/components/ui/sonner";
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
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
  // Resilient to Sanity timeout/failure so crawlers (e.g. Google AdSense) always get 200, not 500.
  let footerTags: string[] = [];
  let footerTypes: { value: string; label: string }[] = [];
  try {
    const [tags, typesWithCounts] = await Promise.all([
      getAllTags(),
      getResourceTypesWithCounts(),
    ]);
    footerTags = tags.slice(0, FOOTER_TAGS_LIMIT);
    footerTypes = typesWithCounts.map((t) => ({
      value: t.value,
      label: t.label,
    }));
  } catch {
    // Sanity unreachable: still render shell so site is not "down or unavailable" for AdSense/crawlers.
  }

  const adsenseClientId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ||
    "ca-pub-9235700263244398";
  const gaId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-YCFR0QKPKM";

  const adsenseScriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;

  return (
    <html lang="en" className="grain" suppressHydrationWarning>
      <head>
        {/* AdSense: raw script in head so Google's crawler can verify (exact snippet format) */}
        <script
          async
          src={adsenseScriptSrc}
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} flex min-h-screen flex-col font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {/* Google consent default must run before gtag config (consent mode v2). */}
          <Script id="google-consent-default" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'granted',
                security_storage: 'granted',
                personalization_storage: 'denied'
              });
            `}
          </Script>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
          <ConsentInitializer />
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
            <Footer tags={footerTags} types={footerTypes} />
          </div>
          <CookieConsent />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
