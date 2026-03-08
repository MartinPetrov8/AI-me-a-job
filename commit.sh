#!/usr/bin/env bash
# Usage: bash commit.sh "feat: S-01 - description"
# Always use this — never raw git add/commit — it prints the hash for output.
set -euo pipefail
git add -A
git status --short
git commit -m "$1"
echo "COMMIT_HASH=$(git rev-parse HEAD)"
