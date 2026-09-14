#!/usr/bin/env bash
# Publish the game to https://mightymen.surge.sh (free static hosting).
# First time on a machine: `npx surge login` with the Mighty Men account, or set
# SURGE_LOGIN / SURGE_TOKEN (get a token with `npx surge token`).
set -euo pipefail
cd "$(dirname "$0")/.."
DOMAIN="${1:-mightymen.surge.sh}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp index.html manifest.json sw.js "$STAGE/"
cp -r src "$STAGE/src"
cp -r icons "$STAGE/icons"
echo "$DOMAIN" > "$STAGE/CNAME"
npx --yes surge "$STAGE" "$DOMAIN"
