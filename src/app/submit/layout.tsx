import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thestash.xyz";

export const metadata: Metadata = {
  title: "Submit a resource | The Stash",
  description:
    "Suggest a dev or design resource. We review each submission for quality and safety before publishing.",
  alternates: { canonical: `${BASE_URL}/submit` },
  openGraph: {
    title: "Submit a resource | The Stash",
    url: `${BASE_URL}/submit`,
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
