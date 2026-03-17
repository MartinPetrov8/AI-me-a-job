# SPEC: Dual Scoring Engine — SQL Structured + pgvector Semantic
**Issues:** #50, #56–59, #64–67  
**Status:** READY FOR IMPLEMENTATION  
**Date:** 2026-03-17  

---

## Strategic Context

The core value proposition of AI-me-a-job is **best possible matching, zero noise**.  
That requires two complementary engines running together:

| Engine | What it catches | What it misses |
|--------|----------------|----------------|
| **SQL structured** | Seniority, industry, education, skills overlap, location | "MLOps Engineer" ≠ "ML Infrastructure" semantically identical jobs |
| **pgvector semantic** | Role synonyms, adjacent domains, implicit requirements | Seniority mismatch (scores Senior and Junior the same) |
| **Hybrid** | Both — structured pre-filters + semantic re-ranking | Nothing |

These are not sequential phases. They ship together as one engine.

---

## Architecture: Two-Phase Query

```
Phase A — SQL pre-filter + structured score (runs in Postgres):
  SELECT ... CASE expressions ... WHERE structured filters ... HAVING score >= 4 ... LIMIT 300

Phase B — pgvector re-rank (cosine similarity on 300 candidates):
  ORDER BY (0.65 * normalized_sql_score + 0.35 * cosine_similarity(job_embedding, profile_embedding)) DESC
  LIMIT 50
```

Why 300 candidates? SQL structured scoring is precise but not complete. We want the vector layer to promote semantically close jobs that might score 4-5 on structured but are actually perfect matches. 300 → vector re-rank → 50 gives it room to work.

### Why not pure SQL for everything?
Postgres supports `ORDER BY embedding <=> $profile_embedding LIMIT 50` via pgvector HNSW, but that ignores structured criteria completely. Pure vector finds "similar text" not "matching requirements". The hybrid is strictly better.

---

## Data Model Changes

### 1. Add to jobs table
```sql
-- Migration: 0003_dual_engine.sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_embedding_hnsw_idx
  ON jobs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL AND classified_at IS NOT NULL;
```

### 2. Add to profiles table
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

### 3. SQL scoring indexes (from M1)
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_sphere_idx    ON jobs (sphere_of_expertise) WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_seniority_idx ON jobs (seniority_level)     WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_industry_idx  ON jobs (industry)             WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_is_remote_idx ON jobs (is_remote)            WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_classified_posted_idx
  ON jobs (classified_at, posted_at DESC NULLS LAST) WHERE classified_at IS NOT NULL;
```

---

## Engine Implementation: `findMatches()`

### Step 1 — SQL structured score (Postgres)

```sql
-- Returns up to 300 candidates with per-criterion scores
SELECT
  id, title, company, location, url, posted_at,
  salary_min, salary_max, salary_currency, employment_type, is_remote,
  embedding,                           -- needed for Step 2

  -- Per-criterion scores (1=match, 0=no match, NULL job field = 1 benefit of doubt)
  CASE WHEN years_experience IS NULL THEN 1
       WHEN array_position($yearsScale::text[], years_experience) IS NULL THEN 1
       WHEN ABS(array_position($yearsScale::text[], years_experience)
              - array_position($yearsScale::text[], $profYears::text)) <= 1
       THEN 1 ELSE 0 END                                         AS c_years,

  CASE WHEN education_level IS NULL THEN 1
       WHEN array_position($eduScale::text[], education_level) IS NULL THEN 1
       WHEN array_position($eduScale::text[], education_level)
            <= array_position($eduScale::text[], $profEdu::text)
       THEN 1 ELSE 0 END                                         AS c_education,

  CASE WHEN field_of_study    IS NULL THEN 1
       WHEN field_of_study    = $field  THEN 1 ELSE 0 END        AS c_field,

  CASE WHEN sphere_of_expertise IS NULL THEN 1
       WHEN sphere_of_expertise = $sphere THEN 1 ELSE 0 END      AS c_sphere,

  CASE WHEN seniority_level IS NULL THEN 1
       WHEN array_position($senScale::text[], seniority_level) IS NULL THEN 1
       WHEN ABS(array_position($senScale::text[], seniority_level)
              - array_position($senScale::text[], $seniority::text)) <= 1
       THEN 1 ELSE 0 END                                         AS c_seniority,

  CASE WHEN languages IS NULL OR cardinality(languages) = 0 THEN 1
       WHEN languages <@ $langs::text[] THEN 1 ELSE 0 END        AS c_languages,

  CASE WHEN industry IS NULL THEN 1
       WHEN industry = $industry THEN 1 ELSE 0 END               AS c_industry,

  CASE WHEN key_skills IS NULL OR cardinality(key_skills) = 0 THEN 1
       WHEN cardinality(ARRAY(
         SELECT unnest(key_skills) INTERSECT SELECT unnest($skills::text[])
       )) >= 2 THEN 1 ELSE 0 END                                 AS c_skills,

  CASE
    WHEN $prefLocation::text IS NULL THEN NULL
    WHEN is_remote = true            THEN 1
    WHEN location IS NULL            THEN 1
    WHEN location ILIKE $locationPattern THEN 2
    ELSE 0
  END                                                            AS c_location,

  -- Structured total
  (c_years + c_education + c_field + c_sphere + c_seniority
   + c_languages + c_industry + c_skills + COALESCE(c_location, 0)) AS sql_score

FROM jobs
WHERE classified_at IS NOT NULL
  -- Hard pre-filters
  AND ($workMode::text IS NULL OR ...)
  AND ($empType::text  IS NULL OR ...)
  AND ($salaryMin::int IS NULL OR salary_max IS NULL OR salary_max >= $salaryMin)
  AND ($salaryMax::int IS NULL OR salary_min IS NULL OR salary_min <= $salaryMax)
  AND ($postedWithin::int IS NULL OR posted_at IS NULL
       OR posted_at >= NOW() - ($postedWithin || ' days')::interval)
  AND ($deltaTs::timestamptz IS NULL OR ingested_at > $deltaTs)

HAVING sql_score >= 4     -- lower threshold to give vector layer room to promote good matches

ORDER BY sql_score DESC
LIMIT 300
```

### Step 2 — JS vector re-rank (in Node.js)

```typescript
// profile_embedding: vector from profiles table (fetched with profile)
// job.embedding: returned in SQL result above

const candidates = sqlRows; // up to 300

// If profile has embedding AND job has embedding → hybrid score
// If either missing → use sql_score normalized to 0-1
const MAX_SQL_SCORE = profile.prefLocation ? 9 : 8;

const scored = candidates.map(job => {
  const sqlNorm = job.sql_score / MAX_SQL_SCORE;  // 0.0 – 1.0
  
  let hybridScore: number;
  if (profile.embedding && job.embedding) {
    const cosine = cosineSimilarity(profile.embedding, job.embedding);  // 0.0 – 1.0
    hybridScore = 0.65 * sqlNorm + 0.35 * cosine;
  } else {
    hybridScore = sqlNorm;  // graceful degradation
  }

  return { ...job, hybrid_score: hybridScore, match_score: job.sql_score };
});

// Return top 50 by hybrid score
return scored
  .sort((a, b) => b.hybrid_score - a.hybrid_score)
  .slice(0, 50);
```

**Important:** `match_score` in the API response stays as the SQL structured score (0-9 integer) — this is what's shown to users on the score ring ("7/8"). `hybrid_score` is internal to sorting only. This preserves backward compatibility with the API contract.

---

## Embedding Pipeline

### Profile embedding
- Computed when CV is uploaded (`/api/upload`) or when profile is first created
- Input text: `{title_inferred} {sphere} {seniority} {industry} {keySkills.join(', ')} {yearsExp} {location}`
- Store in `profiles.embedding`

### Job embedding
- Computed during classification (`/api/pipeline`)
- Input text: `{title} {company} {location} {description_raw.slice(0, 8000)}`
- Store in `jobs.embedding`
- Batch: 100 jobs per API call to OpenAI

### Embedding model
- `text-embedding-3-small` (1536 dim, $0.02/1M tokens)
- 300K jobs × ~500 tokens avg = 150M tokens = **$3.00 total for full backfill**
- Ongoing: ~$0.01 per 500 new jobs

### Backfill strategy
- New: embed at classify time (no backfill needed)
- Existing classified jobs: backfill cron — process 200/run, runs daily until done

### Graceful degradation
- Job with no embedding → cosine = 0, hybrid = sql_norm only
- Profile with no embedding → hybrid = sql_norm only
- If OpenAI embedding API fails → classify succeeds, embed retried next run

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/lib/matching/engine.ts` | Full rewrite — SQL pre-filter (300 candidates) + JS vector re-rank |
| `src/lib/matching/cosine.ts` | New — `cosineSimilarity(a: number[], b: number[])` utility |
| `src/lib/embedding/embed.ts` | New — `embedText(text: string): Promise<number[]>` via OpenAI |
| `src/lib/embedding/embed.test.ts` | New — mock OpenAI, test input construction |
| `src/lib/db/schema.ts` | Add `embedding vector(1536)` to jobs + profiles |
| `src/lib/db/migrations/0003_dual_engine.sql` | pgvector extension + embedding columns + all indexes |
| `src/app/api/upload/route.ts` | Embed profile on CV upload |
| `src/app/api/pipeline/route.ts` | Embed jobs during classification |
| `src/lib/matching/engine.test.ts` | Update mocks for db.execute + cosine mock |
| `src/lib/matching/engine-filters.test.ts` | Update mocks |
| `tests/lib/matching/engine.test.ts` | Update mocks |

---

## API Contract — UNCHANGED

The `MatchResult` and `MatchedJob` interfaces stay identical. `match_score` remains the SQL structured score (0-9). Hybrid scoring is internal.

```typescript
// No change to these interfaces:
export interface MatchedJob { ... match_score: number; ... }
export interface MatchResult { ... max_score: number; ... }
```

---

## Acceptance Criteria (all mechanically verifiable)

### AC-1: Single SQL call per search
```
PASS: db.execute() called exactly once per findMatches() invocation
MEASURE: spy — expect(mockExecute).toHaveBeenCalledTimes(1)
```

### AC-2: Candidate pool is 300 not 50
```
PASS: SQL query uses LIMIT 300 (not 50); final slice is top 50 after re-rank
MEASURE: mock db.execute returning 300 rows → result.results.length === 50
```

### AC-3: Hybrid score uses 0.65/0.35 weights
```
PASS: When both profile.embedding and job.embedding present, hybrid = 0.65*sqlNorm + 0.35*cosine
MEASURE: unit test with known vectors → verify output
```

### AC-4: Graceful degradation when no embeddings
```
PASS: When profile.embedding is null → result.results.length > 0, no crash
PASS: When job.embedding is null → that job is still included, scored on SQL only
MEASURE: unit test with null embeddings
```

### AC-5: match_score in response = SQL structured score (not hybrid)
```
PASS: result.results[0].match_score is an integer 0-9, not a float 0.0-1.0
MEASURE: unit test — check typeof + value range
```

### AC-6: Correct criterion lists from c_* columns
```
PASS: c_sphere=0 → 'sphere_of_expertise' in unmatched_criteria
PASS: c_skills=1 → 'key_skills' in matched_criteria
MEASURE: unit tests with controlled mock rows
```

### AC-7: Location scoring correct
```
PASS: c_location=2 → 'location' in matched, max_score=9
PASS: c_location=0 → 'location' in unmatched
PASS: c_location=null → 'location' absent, max_score=8
MEASURE: unit tests
```

### AC-8: Profile embedding computed on CV upload
```
PASS: POST /api/upload stores non-null embedding in profiles table
MEASURE: integration test — mock OpenAI embed call, verify profile.embedding set
```

### AC-9: Job embedding computed during classification
```
PASS: /api/pipeline classifies + embeds in same step
MEASURE: unit test — mock both classify and embed calls, verify both called
```

### AC-10: Embed backfill is idempotent
```
PASS: Running backfill twice doesn't re-embed already-embedded jobs
MEASURE: unit test — verify embed API not called for jobs with existing embedding
```

### AC-11: All existing tests pass
```
PASS: npm test -- --run exits 0
MEASURE: 194+ tests passing (current baseline)
```

### AC-12: Build clean
```
PASS: npm run build exits 0, no TypeScript errors
MEASURE: build log
```

### AC-13: API contract unchanged
```
PASS: MatchResult and MatchedJob interfaces identical to current
MEASURE: existing route tests pass, no TypeScript errors on interface usage
```

### AC-14: Performance target (manual post-deploy)
```
TARGET: p95 < 800ms at 300K jobs with hybrid scoring
NOT A MERGE BLOCKER — track post-deploy
```

---

## Implementation Order (for Antfarm agent)

1. `src/lib/matching/cosine.ts` — write `cosineSimilarity()` utility (10 lines, easy)
2. `src/lib/embedding/embed.ts` — write `embedText()` and `embedBatch()` (OpenAI API call)
3. `src/lib/embedding/embed.test.ts` — mock OpenAI, test input construction
4. `src/lib/db/schema.ts` — add `embedding vector(1536)` to jobs + profiles; add indexes
5. `src/lib/db/migrations/0003_dual_engine.sql` — full migration file
6. `src/lib/matching/engine.ts` — rewrite `findMatches()`:
   - SQL pre-filter returns 300 candidates (LIMIT 300, HAVING sql_score >= 4)
   - JS vector re-rank with `cosineSimilarity()`
   - Return top 50 by hybrid score, but `match_score` = sql_score
7. `src/app/api/upload/route.ts` — add embed call after profile save
8. `src/app/api/pipeline/route.ts` — add embed call after classification
9. Update test files (engine.test.ts, engine-filters.test.ts, tests/lib/matching/engine.test.ts)
10. `npm test -- --run` → verify AC-11
11. `npm run build` → verify AC-12
12. Commit to `feat/dual-engine`, push, deploy

---

## Drizzle / pgvector Notes

### Enabling pgvector in schema.ts
```typescript
import { vector } from 'drizzle-orm/pg-core';  // requires drizzle-orm >= 0.30

// In jobs table:
embedding: vector('embedding', { dimensions: 1536 }),

// In profiles table:
embedding: vector('embedding', { dimensions: 1536 }),
```

### Query pattern
```typescript
import { sql } from 'drizzle-orm';

// Fetch profile with embedding
const profiles = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
// profile.embedding comes back as number[] from drizzle-orm

// SQL query returns embedding as PG vector literal → parse in JS
// drizzle-orm/postgres-js auto-parses vector columns to number[]
```

### Cosine similarity in JS (not SQL)
We compute cosine in JS (not `1 - (embedding <=> $profileEmb)` in SQL) because:
1. We want the SQL query to stay fast (no vector operations on 300K rows)
2. We only compute cosine on 300 candidates (cheap)
3. Avoids pgvector version dependency issues on Supabase free tier

---

## Environment Variables Required

```
OPENAI_API_KEY=<existing key>  # used for classification — reuse for embeddings
```

No new env vars needed. Embedding uses the same OpenAI client already in the codebase.

---

## Definition of Done

- [ ] AC-1 through AC-13 all pass
- [ ] Branch `feat/dual-engine` merged to `main`
- [ ] Deployed to Vercel
- [ ] Migration file `0003_dual_engine.sql` committed (Martin runs on Supabase manually)
- [ ] Backfill script committed at `scripts/backfill-embeddings.ts`
- [ ] GitHub issues #56–59 and #64–67 referenced in PR description
