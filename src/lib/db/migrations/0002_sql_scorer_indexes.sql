-- Migration: SQL Scorer Indexes (Phase 1 of #50)
-- Adds indexes needed for efficient SQL-based scoring at 300K+ jobs.
-- All CREATE INDEX CONCURRENTLY — no table locks, safe to run on live DB.

-- Scalar equality indexes (CASE expressions in scorer)
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_sphere_idx
  ON jobs (sphere_of_expertise)
  WHERE classified_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_seniority_idx
  ON jobs (seniority_level)
  WHERE classified_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_industry_idx
  ON jobs (industry)
  WHERE classified_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_is_remote_idx
  ON jobs (is_remote)
  WHERE classified_at IS NOT NULL;

-- Composite index: primary WHERE + ORDER BY path
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_classified_posted_idx
  ON jobs (classified_at, posted_at DESC NULLS LAST)
  WHERE classified_at IS NOT NULL;

-- Note: GIN indexes on key_skills and languages already exist from migration 0001.
-- Note: CONCURRENTLY cannot run inside a transaction block.
--       Run this script with psql directly (not in a transaction).
