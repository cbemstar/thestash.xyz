import { ImageResponse } from "next/og";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "…";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "The Stash";
  const description =
    searchParams.get("description") ??
    "Curated directory of dev and design resources: hand-picked tools, inspiration, courses, and links.";
  const siteName = "The Stash";

  const displayTitle = truncate(title, 60);
  const displayDescription = truncate(description, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
          padding: "56px 64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top: site name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            color: "#737373",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {siteName}
        </div>

        {/* Middle: title + description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            justifyContent: "center",
            paddingTop: 24,
            paddingBottom: 24,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 56,
              fontWeight: 700,
              color: "#171717",
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              maxWidth: "100%",
            }}
          >
            {displayTitle}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 28,
              color: "#525252",
              lineHeight: 1.4,
              maxWidth: "100%",
            }}
          >
            {displayDescription}
          </p>
        </div>

        {/* Bottom: accent bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 3,
            background: "linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)",
          }}
        />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
