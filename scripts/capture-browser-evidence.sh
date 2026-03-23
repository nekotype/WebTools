#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="${1:-$(date '+%Y%m-%d_%H%M%S')}"
OUTPUT_DIR="$ROOT_DIR/test-results/browser-evidence/$TIMESTAMP"
ARTIFACT_DIR="/tmp/browser-evidence-artifacts-$TIMESTAMP"
SERVER_PID=""
RUNNER_PATH="$ROOT_DIR/scripts/browser-evidence-run-check.js"
PATTERN_PATH="$ROOT_DIR/scripts/browser-test-patterns.md"
HTTP_LOG="/tmp/browser-evidence-http-$TIMESTAMP.log"
NODE_PATH_CANDIDATE="${PLAYWRIGHT_NODE_PATH:-/home/ryu/.npm/_npx/e41f203b7505f1fb/node_modules}"
CHROMIUM_PATH="${PLAYWRIGHT_CHROMIUM_PATH:-/home/ryu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome}"
ALSA_PATH="${PLAYWRIGHT_LD_LIBRARY_PATH:-/tmp/alsa-lib/extracted/usr/lib/x86_64-linux-gnu}"

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

rm -rf "$ARTIFACT_DIR"
mkdir -p "$OUTPUT_DIR"

python3 -m http.server 4173 --bind 127.0.0.1 --directory "$ROOT_DIR" >"$HTTP_LOG" 2>&1 &
SERVER_PID=$!
sleep 1

env \
  NODE_PATH="$NODE_PATH_CANDIDATE" \
  PLAYWRIGHT_NODE_PATH="$NODE_PATH_CANDIDATE" \
  PLAYWRIGHT_CHROMIUM_PATH="$CHROMIUM_PATH" \
  ARTIFACT_DIR="$ARTIFACT_DIR" \
  BASE_URL="http://127.0.0.1:4173" \
  LD_LIBRARY_PATH="$ALSA_PATH${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" \
  node "$RUNNER_PATH"

cp "$ARTIFACT_DIR"/*.png "$OUTPUT_DIR"/
cp "$ARTIFACT_DIR"/*.webm "$OUTPUT_DIR"/
cp "$ARTIFACT_DIR"/run-summary.json "$OUTPUT_DIR"/
cp "$RUNNER_PATH" "$OUTPUT_DIR"/
cp "$PATTERN_PATH" "$OUTPUT_DIR"/

printf '%s\n' "$OUTPUT_DIR"
