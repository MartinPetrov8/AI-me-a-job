#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== CI: TypeScript Type Check ==="
npm run typecheck 2>&1
echo "✓ Type check passed"

echo ""
echo "=== CI: Build ==="
npm run build 2>&1
echo "✓ Build passed"

echo ""
echo "=== CI: Tests ==="
npm run test 2>&1
echo "✓ Tests passed"

echo ""
echo "✅ CI PASSED"
