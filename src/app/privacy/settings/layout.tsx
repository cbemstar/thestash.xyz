import type { Metadata } from "next";

import { BASE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Privacy and cookie settings | The Stash",
  description:
    "Manage your cookie and privacy preferences: personalized ads, consent choices, and cookie banner.",
  alternates: { canonical: `${BASE_URL}/privacy/settings` },
  robots: { index: true, follow: true },
};

export default function PrivacySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
