import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbListJsonLd } from "@/components/BreadcrumbListJsonLd";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "Privacy Policy | The Stash",
  description:
    "Privacy policy for The Stash: how we collect, use, and protect your data. Cookies, third-party ads (Google AdSense), and your choices.",
  alternates: { canonical: `${BASE_URL}/privacy` },
  robots: { index: true, follow: true },
};

const breadcrumbItems = [
  { name: "The Stash", url: `${BASE_URL}/` },
  { name: "Privacy Policy", url: `${BASE_URL}/privacy` },
];

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbListJsonLd items={breadcrumbItems} />
      <div className="min-h-screen">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[{ label: "The Stash", href: "/" }, { label: "Privacy Policy" }]}
            className="mb-6"
          />
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: February 2025
          </p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <section>
              <h2 className="font-semibold text-foreground mb-2">1. Introduction</h2>
              <p>
                The Stash (“we”, “our”, or “us”) operates thestash.xyz. This policy describes how we
                collect, use, and protect your information when you use our site.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">2. Information we collect</h2>
              <p>
                We may collect information you provide directly (e.g. email when you subscribe to
                updates) and information collected automatically when you visit, such as your IP
                address, browser type, device type, and pages visited. We use this to operate the
                site, improve content, and analyze usage.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">3. Cookies and similar tech</h2>
              <p>
                We use cookies and similar technologies for essential operation, preferences, and
                analytics. Third-party services (including Google AdSense, described below) may
                also set cookies to show ads and measure ad performance. You can control or delete
                cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">4. Third-party advertising (Google AdSense)</h2>
              <p>
                We use Google AdSense to display ads on The Stash. Google and its partners may use
                cookies and similar tech to show you relevant ads based on your interests and to
                measure ad effectiveness. You can learn more and control how Google uses data for
                advertising at{" "}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Google’s advertising policy
                </a>
                . In some regions (e.g. EEA, UK), we obtain your consent before using data for
                personalized ads; you can reject personalized ads via our cookie banner or your
                browser/device settings.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">5. Your choices</h2>
              <p>
                You can opt out of personalized advertising via Google’s{" "}
                <a
                  href="https://adssettings.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Ad Settings
                </a>
                . You can also use browser extensions or settings to block or limit cookies. If
                you have subscribed to our newsletter, you can unsubscribe using the link in any
                email we send.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">6. Data retention and security</h2>
              <p>
                We retain data only as long as needed to operate the site and comply with law. We
                take reasonable steps to protect your data; no method of transmission or storage
                is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">7. Changes</h2>
              <p>
                We may update this policy from time to time. The “Last updated” date at the top
                will change when we do. Continued use of the site after changes means you accept
                the updated policy.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground mb-2">8. Contact</h2>
              <p>
                For questions about this privacy policy or your data, contact us via the{" "}
                <Link href="/about" className="text-foreground underline underline-offset-2 hover:text-primary">
                  About
                </Link>{" "}
                page.
              </p>
            </section>
          </div>

          <p className="mt-10 text-center">
            <Link href="/" className="text-foreground underline underline-offset-2 hover:text-primary">
              Back to The Stash
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}
