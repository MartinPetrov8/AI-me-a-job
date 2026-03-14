#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== CI: Typecheck ==="
tsc --noEmit

echo "=== CI: Build ==="
npm run build 2>&1 | tail -20

echo "=== CI: Tests ==="
npm run test 2>&1

echo ""
echo "✅ CI PASSED"
