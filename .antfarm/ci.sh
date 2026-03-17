#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== CI: Build ==="
npm run build 2>&1

echo ""
echo "=== CI: Tests ==="
npm run test 2>&1

echo ""
echo "=== CI: Typecheck ==="
npx tsc --noEmit 2>&1

echo ""
echo "✅ CI PASSED"
