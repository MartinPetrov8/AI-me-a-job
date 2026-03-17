# Migration 0003: Dual Engine (pgvector + SQL scoring)

## Purpose
Add vector embedding support and SQL scoring indexes for hybrid job matching.

## Prerequisites
- Supabase project with Postgres 14+
- pgvector extension available (contact Supabase support if not enabled)

## Execution Instructions

### 1. Verify pgvector availability
In Supabase SQL Editor, run:
```sql
SELECT * FROM pg_available_extensions WHERE name = 'vector';
```
If no results, contact Supabase support to enable pgvector.

### 2. Apply migration
Execute the migration file in Supabase SQL Editor:
```
src/lib/db/migrations/0003_dual_engine.sql
```

The migration contains:
- `CREATE EXTENSION IF NOT EXISTS vector;` — enables pgvector
- Two `vector(1536)` columns: `jobs.embedding` and `profiles.embedding` (nullable)
- HNSW index on `jobs.embedding` for fast cosine similarity search (m=16, ef_construction=64)
- Five SQL scoring indexes for structured pre-filtering:
  - `jobs_sphere_idx` (sphere_of_expertise)
  - `jobs_seniority_idx` (seniority_level)
  - `jobs_industry_idx` (industry)
  - `jobs_is_remote_idx` (is_remote)
  - `jobs_classified_posted_idx` (classified_at, posted_at DESC)

### 3. Verify migration
After execution, verify indexes exist:
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('jobs', 'profiles') 
  AND indexname LIKE '%embedding%' OR indexname LIKE '%sphere%' OR indexname LIKE '%seniority%';
```

Expected indexes:
- `jobs_embedding_hnsw_idx`
- `jobs_sphere_idx`
- `jobs_seniority_idx`
- `jobs_industry_idx`
- `jobs_is_remote_idx`
- `jobs_classified_posted_idx`

### 4. Safe to run multiple times
All statements use `IF NOT EXISTS` or `CONCURRENTLY` — safe to re-run if partial failure occurs.

## Rollback (if needed)
```sql
DROP INDEX CONCURRENTLY IF EXISTS jobs_embedding_hnsw_idx;
DROP INDEX CONCURRENTLY IF EXISTS jobs_sphere_idx;
DROP INDEX CONCURRENTLY IF EXISTS jobs_seniority_idx;
DROP INDEX CONCURRENTLY IF EXISTS jobs_industry_idx;
DROP INDEX CONCURRENTLY IF EXISTS jobs_is_remote_idx;
DROP INDEX CONCURRENTLY IF EXISTS jobs_classified_posted_idx;
ALTER TABLE jobs DROP COLUMN IF EXISTS embedding;
ALTER TABLE profiles DROP COLUMN IF EXISTS embedding;
-- Do NOT drop the vector extension if other projects use it
```

## Post-Migration
- Embeddings remain null until jobs are classified and profiles are uploaded
- Null embeddings gracefully degrade — structured scoring still works
- HNSW index only applies to rows with non-null embeddings and classified_at
