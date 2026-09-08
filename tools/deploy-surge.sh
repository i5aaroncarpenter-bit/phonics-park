#!/usr/bin/env bash
# Publish the game to https://phonicsbowl.surge.sh (free static hosting).
# First time: `npx surge login` with the Phonics Bowl account, or set
# SURGE_LOGIN / SURGE_TOKEN (get a token with `npx surge token`).
set -euo pipefail
cd "$(dirname "$0")/.."
DOMAIN="${1:-phonicsbowl.surge.sh}"
STAGE="$(mktemp -d)"
cp index.html "$STAGE/"
cp -r src assets "$STAGE/"
echo "$DOMAIN" > "$STAGE/CNAME"
npx --yes surge "$STAGE" "$DOMAIN"
rm -rf "$STAGE"
