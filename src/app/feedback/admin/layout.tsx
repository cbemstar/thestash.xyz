import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback admin",
  robots: { index: false, follow: false },
};

export default function FeedbackAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
