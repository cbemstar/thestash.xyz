import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Press_Start_2P } from "next/font/google";
import { SafeThemeProvider } from "@/components/SafeThemeProvider";
import { SafeLenisProvider } from "@/components/SafeLenisProvider";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConsentInitializer } from "@/components/ConsentInitializer";
import { OrganicLandTracker } from "@/components/OrganicLandTracker";
import { EmailCapturePopup } from "@/components/EmailCapturePopup";
import { Toaster } from "@/components/ui/sonner";
import { getAllTags, getResourceTypesWithCounts, getResourceCount } from "@/lib/sanity.resource";
import { getCollectionCount } from "@/lib/sanity.collection";
import { getAllTools } from "@/lib/tools-catalog";
import { getAllCalculators } from "@/lib/calculators-catalog";
import "./globals.css";

import { BASE_URL } from "@/lib/site-url";

const PressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start-2p",
});

/** Max tags to show in footer (avoid excessive links per Semrush). */
const FOOTER_TAGS_LIMIT = 28;

export const metadata: Metadata = {
  title: "The Stash | Dev & Design Resources",
  description:
    "Curated directory of dev and design resources: hand-picked tools, inspiration, courses, AI tools, and links for developers and designers. Browse by category or explore collections.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "The Stash | Dev & Design Resources",
    description:
      "Curated directory of dev and design resources: hand-picked tools, inspiration, courses, AI tools, and links for developers and designers.",
    siteName: "The Stash",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "The Stash" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Stash | Dev & Design Resources",
    description:
      "Curated directory of dev and design resources: hand-picked tools, inspiration, courses, AI tools, and links.",
  },
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
  const footerTools = getAllTools().map((tool) => ({ slug: tool.slug, title: tool.title }));
  const footerCalculators = getAllCalculators().map((calculator) => ({
    slug: calculator.slug,
    title: calculator.title,
  }));
  let resourceCount = 0;
  let collectionCount = 0;
  try {
    const [tags, typesWithCounts, resourceCountRes, collectionCountRes] = await Promise.all([
      getAllTags(),
      getResourceTypesWithCounts(),
      getResourceCount(),
      getCollectionCount(),
    ]);
    footerTags = tags.slice(0, FOOTER_TAGS_LIMIT);
    footerTypes = typesWithCounts.map((t) => ({
      value: t.value,
      label: t.label,
    }));
    resourceCount = resourceCountRes;
    collectionCount = collectionCountRes;
  } catch {
    // Sanity unreachable: still render shell so site is not "down or unavailable" for AdSense/crawlers.
  }

  const adsenseClientId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ||
    "ca-pub-9235700263244398";
  const gaId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-YCFR0QKPKM";
  const gtmId =
    process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-MX9CKB43";
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";
  const uiThemePreset =
    process.env.NEXT_PUBLIC_THEME_PRESET?.trim().toLowerCase() === "candyland"
      ? "candyland"
      : undefined;

  const adsenseScriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;

  return (
    <html
      lang="en"
      className="grain"
      data-theme-preset={uiThemePreset}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to critical origins for faster LCP and TBT */}
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${PressStart2P.variable} flex min-h-screen flex-col font-sans antialiased`}
        suppressHydrationWarning
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <SafeThemeProvider>
          {/* Google Tag Manager */}
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
          {/* AdSense: load after page interactive to avoid blocking LCP/TBT */}
          <Script src={adsenseScriptSrc} strategy="lazyOnload" crossOrigin="anonymous" />
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
          {recaptchaSiteKey ? (
            <Script
              id="recaptcha-v3"
              strategy="afterInteractive"
              src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
            />
          ) : null}
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
          <ConsentInitializer />
          <OrganicLandTracker />
          <SafeLenisProvider>
            <div className="flex min-h-screen flex-col">
              <main className="flex-1">{children}</main>
              <Footer
                tags={footerTags}
                types={footerTypes}
                tools={footerTools}
                calculators={footerCalculators}
                resourceCount={resourceCount}
                collectionCount={collectionCount}
              />
            </div>
          </SafeLenisProvider>
          <CookieConsent />
          <EmailCapturePopup />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </SafeThemeProvider>
      </body>
    </html>
  );
}
