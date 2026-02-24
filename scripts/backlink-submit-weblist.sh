#!/usr/bin/env bash
# Submit The Stash to weblist.dev using agent-browser (from .agents/skills/agent-browser).
# Requires: npm install agent-browser (local) then agent-browser install
#
# Usage: ./scripts/backlink-submit-weblist.sh [email]
#   email  Optional. Contact email for the listing (default: hello@thestash.xyz)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EMAIL="${1:-hello@thestash.xyz}"
URL="https://weblist.dev/submit-your-tool/"

# Prefer local agent-browser (from repo node_modules)
if [[ -x "$REPO_ROOT/node_modules/.bin/agent-browser" ]]; then
  AB="$REPO_ROOT/node_modules/.bin/agent-browser"
elif command -v agent-browser &>/dev/null; then
  AB="agent-browser"
else
  echo "agent-browser not found. From repo root run: npm install agent-browser && ./node_modules/.bin/agent-browser install"
  exit 1
fi

echo "Opening $URL ..."
"$AB" open "$URL"
"$AB" wait --load networkidle

# Refs from snapshot -i: e4=Name Website, e5=Your email, e6=WebSite URL, e7=Submit
"$AB" fill @e4 "The Stash"
"$AB" fill @e6 "https://thestash.xyz"
"$AB" fill @e5 "$EMAIL"
"$AB" click @e7
"$AB" wait --load networkidle
"$AB" get url
"$AB" snapshot -i
"$AB" screenshot /tmp/weblist-submit-result.png 2>/dev/null || true
echo "Screenshot: /tmp/weblist-submit-result.png"
"$AB" close
echo "Done. Check your email ($EMAIL) for confirmation if the site sends one."
