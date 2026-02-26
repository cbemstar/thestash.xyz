#!/usr/bin/env python3
"""
Check if a URL is reachable (2xx). Use as fallback when Node fetch gets 403/timeout.
Usage:
  python scripts/check_url_scrapling.py <url>           # plain HTTP (fast)
  python scripts/check_url_scrapling.py <url> --stealth # headless browser (Cloudflare etc.)
Exit: 0 if 2xx, 1 otherwise. Prints status and content-type to stderr.
"""
import sys
import argparse


def main() -> int:
    parser = argparse.ArgumentParser(description="Check URL reachability via Scrapling")
    parser.add_argument("url", help="URL to check")
    parser.add_argument(
        "--stealth",
        action="store_true",
        help="Use StealthyFetcher (headless browser) for Cloudflare/protected sites",
    )
    parser.add_argument("--timeout", type=int, default=25, help="Timeout in seconds (default 25)")
    args = parser.parse_args()
    url = (args.url or "").strip()
    if not url:
        print("error: URL required", file=sys.stderr)
        return 1
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        if args.stealth:
            from scrapling.fetchers import StealthyFetcher
            StealthyFetcher.adaptive = True
            page = StealthyFetcher.fetch(
                url,
                headless=True,
                network_idle=True,
                timeout=args.timeout * 1000,
            )
        else:
            from scrapling.fetchers import Fetcher
            page = Fetcher.get(url, timeout=args.timeout)
        # Success: we got a response (Scrapling raises on 4xx/5xx or connection failure)
        print("ok", file=sys.stderr)
        return 0
    except Exception as e:
        print(f"error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
