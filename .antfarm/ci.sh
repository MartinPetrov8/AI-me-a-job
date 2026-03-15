#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# --- CI: Build ---
echo "CI: Running build..."
npm run build 2>&1

# --- CI: Type Check ---
echo "CI: Running type check..."
npx tsc --noEmit 2>&1

# --- CI: Tests ---
echo "CI: Running tests..."
npm run test 2>&1

echo "CI PASSED"
