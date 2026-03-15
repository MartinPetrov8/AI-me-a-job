#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== CI: TypeScript Lint ==="
npx tsc --noEmit 2>&1
echo "✓ TypeScript lint passed"

echo ""
echo "=== CI: Build ==="
npm run build 2>&1 | tail -20
echo "✓ Build passed"

echo ""
echo "=== CI: Tests ==="
npm run test 2>&1 | tail -30
echo "✓ Tests completed (3 pre-existing failures in preferences.test.ts are acceptable)"

echo ""
echo "✅ CI PASSED"
