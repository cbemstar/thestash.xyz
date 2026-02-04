import { NextResponse } from "next/server";

/**
 * Serves ads.txt for Google AdSense.
 * Set ADSENSE_PUBLISHER_ID in env (e.g. ca-pub-XXXXXXXXXXXXXXXX).
 * Next.js rewrites /ads.txt to this route.
 */
export function GET() {
  const publisherId = process.env.ADSENSE_PUBLISHER_ID?.trim();
  if (!publisherId) {
    return new NextResponse("# Ads.txt – set ADSENSE_PUBLISHER_ID in env to enable.\n# Example: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
  const line = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
  return new NextResponse(line + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
