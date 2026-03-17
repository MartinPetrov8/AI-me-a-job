# SPEC-M1: SQL Scoring Engine
**Issue:** #50  
**Status:** READY FOR IMPLEMENTATION  
**Date:** 2026-03-17  

---

## Problem

The current `findMatches()` loads ALL classified jobs from Postgres into Node.js memory, then scores them in JavaScript:

```
SELECT * FROM jobs WHERE classified_at IS NOT NULL  →  300K rows  →  JS loop  →  top 50
```

At 300K jobs this means:
- ~300MB Node.js memory allocation per request
- 10–15s query + loop time
- Vercel serverless OOM / timeout at scale

**Hard ceiling: must be fixed before the job database scales beyond ~20K rows.**

---

## Solution

Push scoring into a single SQL query. Postgres scores all jobs server-side, applies `HAVING score >= 5`, and returns **exactly 50 rows**.

```
One SQL query → Postgres scores in-place → 50 rows returned → JS builds criterion lists
```

No memory explosion. Scales to 1M+ jobs with proper indexes.

---

## Architecture

### DB driver
`drizzle-orm/postgres-js` with `postgres` client, `prepare: false` (pgbouncer transaction mode).  
Raw SQL: `db.execute(sql\`...\`)` using Drizzle's tagged template literal.  
**Not** `sql.raw()` — that doesn't work with pgbouncer prepare=false.

### Query shape

```sql
SELECT
  id, title, company, location, url, posted_at,
  salary_min, salary_max, salary_currency, employment_type, is_remote,

  -- Per-criterion columns (0 or 1 each; NULL job field = benefit of doubt = 1)
  CASE WHEN years_experience IS NULL
       THEN 1
       WHEN array_position(${yearsScale}::text[], years_experience) IS NULL THEN 1
       WHEN ABS(array_position(${yearsScale}::text[], years_experience)
              - array_position(${yearsScale}::text[], ${yearsExp}::text)) <= 1
       THEN 1 ELSE 0 END                                         AS c_years,

  CASE WHEN education_level IS NULL THEN 1
       WHEN array_position(${eduScale}::text[], education_level) IS NULL THEN 1
       WHEN array_position(${eduScale}::text[], education_level)
            <= array_position(${eduScale}::text[], ${eduLevel}::text)
       THEN 1 ELSE 0 END                                         AS c_education,

  CASE WHEN field_of_study IS NULL THEN 1
       WHEN field_of_study = ${field}  THEN 1 ELSE 0 END         AS c_field,

  CASE WHEN sphere_of_expertise IS NULL THEN 1
       WHEN sphere_of_expertise = ${sphere} THEN 1 ELSE 0 END    AS c_sphere,

  CASE WHEN seniority_level IS NULL THEN 1
       WHEN array_position(${senScale}::text[], seniority_level) IS NULL THEN 1
       WHEN ABS(array_position(${senScale}::text[], seniority_level)
              - array_position(${senScale}::text[], ${seniority}::text)) <= 1
       THEN 1 ELSE 0 END                                         AS c_seniority,

  CASE WHEN languages IS NULL OR cardinality(languages) = 0 THEN 1
       WHEN languages <@ ${langs}::text[] THEN 1 ELSE 0 END      AS c_languages,

  CASE WHEN industry IS NULL THEN 1
       WHEN industry = ${industry} THEN 1 ELSE 0 END             AS c_industry,

  CASE WHEN key_skills IS NULL OR cardinality(key_skills) = 0 THEN 1
       WHEN cardinality(ARRAY(
              SELECT unnest(key_skills)
              INTERSECT
              SELECT unnest(${skills}::text[])
            )) >= 2
       THEN 1 ELSE 0 END                                         AS c_skills,

  -- Location: 0=penalty / 1=neutral / 2=bonus (only scored when user set prefLocation)
  CASE
    WHEN ${prefLocation}::text IS NULL THEN NULL   -- no pref → not a criterion
    WHEN is_remote = true          THEN 1
    WHEN location IS NULL          THEN 1
    WHEN location ILIKE ${locationPattern} THEN 2
    ELSE 0
  END                                                            AS c_location,

  -- Total score
  (c_years + c_education + c_field + c_sphere + c_seniority
   + c_languages + c_industry + c_skills
   + COALESCE(c_location, 0))                                    AS total_score

FROM jobs
WHERE classified_at IS NOT NULL
  -- Hard pre-filters (cheap, use indexes, applied before scoring)
  AND (${workMode}::text IS NULL
       OR (${workMode} = 'Remote'  AND is_remote = true)
       OR (${workMode} = 'On-site' AND (is_remote = false OR is_remote IS NULL))
       OR ${workMode} = 'Hybrid'
       OR ${workMode} = 'Any')
  AND (${empType}::text IS NULL
       OR employment_type IS NULL
       OR employment_type = ${empType})
  AND (${salaryMin}::int IS NULL
       OR salary_max IS NULL
       OR salary_max >= ${salaryMin})
  AND (${salaryMax}::int IS NULL
       OR salary_min IS NULL
       OR salary_min <= ${salaryMax})
  AND (${postedWithin}::int IS NULL
       OR posted_at IS NULL
       OR posted_at >= NOW() - (${postedWithin} || ' days')::interval)
  AND (${deltaTs}::timestamptz IS NULL
       OR ingested_at > ${deltaTs})

HAVING (c_years + c_education + c_field + c_sphere + c_seniority
        + c_languages + c_industry + c_skills
        + COALESCE(c_location, 0)) >= 5

ORDER BY total_score DESC, posted_at DESC NULLS LAST
LIMIT 50
```

**Key notes:**
- All profile values passed as typed Drizzle bindings — no string interpolation.
- `c_location` is NULL when no prefLocation set (not a scored criterion).
- `COALESCE(c_location, 0)` in HAVING ensures no crash when location is not scored.
- `HAVING` clause mirrors the `total_score` expression — Postgres optimises this.
- Ordinal scales (YEARS_EXPERIENCE, EDUCATION_LEVELS, SENIORITY_LEVELS) passed as `text[]` array literals — computed once in JS and passed as a single binding per scale.

### JS post-processing

After the query returns 50 rows, JS reconstructs `matched_criteria` and `unmatched_criteria` arrays from the per-column scores (`c_years`, `c_education`, etc.). This logic is identical to today's logic — just moved from scoring to labelling.

```typescript
const CRITERIA_MAP = [
  ['years_experience', 'c_years'],
  ['education_level',  'c_education'],
  ['field_of_study',   'c_field'],
  ['sphere_of_expertise', 'c_sphere'],
  ['seniority_level',  'c_seniority'],
  ['languages',        'c_languages'],
  ['industry',         'c_industry'],
  ['key_skills',       'c_skills'],
] as const;

// Location only when prefLocation is set
if (prefLocation) {
  if (c_location === 2) matched.push('location');
  else if (c_location === 0) unmatched.push('location');
  // c_location === 1 = neutral → omit from both lists
}
```

---

## New Indexes Required

Add to `src/lib/db/schema.ts` (Drizzle) and `src/lib/db/migrations/0002_sql_scorer_indexes.sql`:

```sql
-- Scalar equality lookups in CASE expressions
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_sphere_idx    ON jobs (sphere_of_expertise) WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_seniority_idx ON jobs (seniority_level)     WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_industry_idx  ON jobs (industry)             WHERE classified_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_is_remote_idx ON jobs (is_remote)            WHERE classified_at IS NOT NULL;

-- Primary WHERE + ORDER BY path
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_classified_posted_idx
  ON jobs (classified_at, posted_at DESC NULLS LAST)
  WHERE classified_at IS NOT NULL;
```

GIN indexes on `key_skills` and `languages` already exist from migration 0001.

---

## Files to Change

| File | Change |
|------|--------|
| `src/lib/matching/engine.ts` | Full rewrite — replace JS scoring loop with single SQL query via `db.execute(sql\`...\`)` |
| `src/lib/db/schema.ts` | Add 5 new index definitions |
| `src/lib/db/migrations/0002_sql_scorer_indexes.sql` | CREATE INDEX CONCURRENTLY statements |
| `src/lib/matching/engine.test.ts` | Update mocks: `db.execute` instead of `db.select().from(jobs)` |
| `src/lib/matching/engine-filters.test.ts` | Update mocks — same pattern |
| `tests/lib/matching/engine.test.ts` | Update mocks — same pattern |

**Not changing:** API routes, MatchResult interface, UI components, classification pipeline.

---

## Acceptance Criteria

Every criterion below must be mechanically verifiable before merge.

### AC-1: Single query
```
PASS: db.execute() called exactly once per findMatches() invocation
MEASURE: mock spy — expect(mockExecute).toHaveBeenCalledTimes(1)
```

### AC-2: Correct criterion lists
```
PASS: When SQL returns c_sphere=0, c_skills=0 → unmatched_criteria contains
      ['sphere_of_expertise', 'key_skills']
MEASURE: unit test with controlled mock rows
```

### AC-3: Score threshold enforced
```
PASS: SQL HAVING filters < 5 score — engine returns 0 results when all rows below threshold
MEASURE: mock db.execute returns [] → result.results.length === 0
```

### AC-4: Location scoring
```
PASS: c_location=2 → 'location' in matched_criteria, max_score=9
PASS: c_location=0 → 'location' in unmatched_criteria
PASS: c_location=1 → 'location' in neither list (neutral)
PASS: c_location=null (no prefLocation) → 'location' absent, max_score=8
MEASURE: unit tests with controlled mock rows
```

### AC-5: All existing tests pass
```
PASS: npm test -- --run exits 0
MEASURE: 194+ tests passing (current baseline: 194)
```

### AC-6: Build clean
```
PASS: npm run build exits 0, no TypeScript errors
MEASURE: CI / local build
```

### AC-7: Migration idempotent
```
PASS: Running 0002_sql_scorer_indexes.sql twice does not error (IF NOT EXISTS)
MEASURE: manual check on migration SQL
```

### AC-8: API contract unchanged
```
PASS: GET /api/search response shape identical to current (same MatchResult fields)
MEASURE: existing API route tests pass (no new failures in tests/api/search.test.ts)
```

### AC-9: Overrides still work
```
PASS: locationOverride='Berlin' → max_score=9 (prefLocation set)
PASS: workModeOverride='remote' → no crash, execute called once
PASS: employmentTypeOverride='full-time' → no crash, execute called once
MEASURE: unit tests
```

### AC-10: Performance target (manual, post-deploy)
```
TARGET: p95 < 500ms at 50K classified jobs on Supabase free tier
MEASURE: run migration on prod, trigger /api/pipeline to ingest 50K jobs,
         time 10 consecutive /api/search calls, p95 < 500ms
NOTE: not a blocker for merge — blocker is AC-1 through AC-9
```

---

## Implementation Steps (for Antfarm agent)

### Step 1: engine.ts rewrite
- Remove all JS scoring logic (`calculateMatch`, `matchYearsExperience`, etc.)
- Keep `scoreLocation` exported (still used in unit tests)
- Implement `findMatches()` with single `db.execute(sql\`...\`)` call
- Pass all profile fields as typed Drizzle bindings (not string interpolation)
- Reconstruct `matched_criteria` / `unmatched_criteria` from returned `c_*` columns
- Keep identical `MatchResult` return shape

### Step 2: schema.ts + migration
- Add 5 index definitions to schema.ts jobs table
- Create `src/lib/db/migrations/0002_sql_scorer_indexes.sql` with CONCURRENTLY statements

### Step 3: test updates
- `src/lib/matching/engine.test.ts` — add `mockExecute` via `vi.hoisted`, add `execute` to db mock
- `src/lib/matching/engine-filters.test.ts` — same pattern
- `tests/lib/matching/engine.test.ts` — same pattern
- Verify all AC-1 through AC-9 tests are explicitly present

### Step 4: verify
- `npm test -- --run` → all pass
- `npm run build` → clean
- Manual: trigger one search on live site, confirm results shape unchanged

---

## Out of Scope (Phase 2 — separate issue)

- pgvector semantic embedding layer
- Embedding at ingestion time
- ANN pre-filtering
- Hybrid SQL + vector search

---

## Risk: Drizzle raw SQL API

`drizzle-orm/postgres-js` v0.45.x uses the `sql` tagged template literal for `db.execute()`.  
The syntax is:
```typescript
import { sql } from 'drizzle-orm';
const rows = await db.execute<RowType>(sql`SELECT ... FROM jobs WHERE ...`);
```

With pgbouncer `prepare: false`, all bindings must use the tagged template syntax (`${value}`) — NOT positional `$1` placeholders. Drizzle handles the serialisation.

**Gotcha:** Arrays must be cast: `${profile.keySkills}::text[]`.  
**Gotcha:** NULL checks must use `${null}::text IS NULL` pattern — don't pass undefined.

---

## Definition of Done

- [ ] AC-1 through AC-9 all pass
- [ ] PR merged to main
- [ ] Deployed to Vercel (aimeajob.vercel.app)
- [ ] Migration SQL added to repo (not yet run on prod — Martin runs manually)
- [ ] GitHub issue #50 updated with completion comment
