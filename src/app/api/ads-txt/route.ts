import { NextResponse } from "next/server";

/** Exact ads.txt line required by Google AdSense for site verification. */
const ADS_TXT_LINE =
  "google.com, pub-9235700263244398, DIRECT, f08c47fec0942fa0";

/**
 * Serves ads.txt for Google AdSense.
 * Uses ADSENSE_PUBLISHER_ID in env if set (e.g. ca-pub-XXXXXXXXXXXXXXXX), otherwise
 * serves the default line required by AdSense for this site.
 * Next.js rewrites /ads.txt to this route.
 */
export function GET() {
  const publisherId = process.env.ADSENSE_PUBLISHER_ID?.trim();
  const line = publisherId
    ? `google.com, ${publisherId.startsWith("ca-pub-") ? publisherId.replace("ca-pub-", "pub-") : publisherId}, DIRECT, f08c47fec0942fa0`
    : ADS_TXT_LINE;
  return new NextResponse(line + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
