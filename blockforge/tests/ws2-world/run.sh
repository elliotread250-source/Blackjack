#!/bin/sh
# Runs the WS2 node test suites (bundled with esbuild). Usage: sh tests/ws2-world/run.sh [light|fluids|bench|storage]
cd "$(dirname "$0")/../.."
OUT=/tmp/claude-0/-home-user-Blackjack/26b70c72-15d6-5390-92e8-4170e0677498/scratchpad/ws2-world
mkdir -p "$OUT"
run() {
  npx esbuild "tests/ws2-world/$1.ts" --bundle --platform=node --format=esm --log-level=warning --outfile="$OUT/$1.mjs"
  node "$OUT/$1.mjs"
}
if [ -n "$1" ] && [ "$1" != "storage" ]; then
  if [ -f "tests/ws2-world/$1.test.ts" ]; then run "$1.test"; else run "$1"; fi
  exit
fi
if [ -z "$1" ]; then
  run light.test || FAIL=1
  run fluids.test || FAIL=1
  run bench || FAIL=1
fi
npx esbuild tests/ws2-world/storage.entry.ts --bundle --format=iife --log-level=warning --outfile="$OUT/storage.iife.js"
NODE_PATH=$(npm root -g) node tests/ws2-world/storage.browser.cjs "$OUT/storage.iife.js" || FAIL=1
exit ${FAIL:-0}
