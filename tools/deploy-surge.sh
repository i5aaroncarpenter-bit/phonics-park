#!/usr/bin/env bash
# Publish the game to https://davidsmightymen.surge.sh (free static hosting).
# First time on a machine: `npx surge login` with the Mighty Men account, or set
# SURGE_LOGIN / SURGE_TOKEN (get a token with `npx surge token`).
set -euo pipefail
cd "$(dirname "$0")/.."
DOMAIN="${1:-davidsmightymen.surge.sh}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp index.html "$STAGE/"
cp -r src "$STAGE/src"
echo "$DOMAIN" > "$STAGE/CNAME"
npx --yes surge "$STAGE" "$DOMAIN"
