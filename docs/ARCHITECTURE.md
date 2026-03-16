# aimeajob — System Architecture

## End-to-End Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────┘

[1] CV Upload
    User uploads PDF/DOCX at /upload
           │
           ▼
[2] LLM Extraction  (src/lib/cv-parser/ + src/lib/llm/extract-cv.ts)
    CV text → OpenRouter (qwen/qwen-2.5-72b) → structured profile fields
    Extracts: yearsExperience, educationLevel, fieldOfStudy, sphereOfExpertise,
              seniorityLevel, industry, languages, keySkills
           │
           ▼
[3] Profile stored in Postgres  (table: profiles)
    Also stores: prefLocation, prefWorkMode, prefEmploymentType, prefSalaryMin
    Set by user on /profile and /preferences pages
           │
           ▼
[4] User triggers search at /results
           │
           ▼
[5] Match Engine  (src/lib/matching/engine.ts → POST /api/search)
    Reads ALL jobs from DB → applies pre-filters → scores each → ranks → returns top 50
    (see RANKING-ALGORITHM.md for full details)
           │
           ▼
[6] Results displayed at /results
    Sort/filter controls applied client-side (score, date, salary, remote, employment type)
    Edit Preferences panel re-triggers search server-side with updated prefs


┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKGROUND PIPELINE                               │
└─────────────────────────────────────────────────────────────────────────┘

[A] Ingestion Cron  (Vercel cron: /api/pipeline, daily 06:00 UTC)
    ├── Adzuna API  → 7 countries (GB, US, DE, FR, NL, AU, BG)
    ├── dev.bg      → AJAX endpoint (WP Job Manager)
    ├── jobs.bg     → Playwright stealth (local only — no Playwright on Vercel)
    └── Jooble      → BLOCKED (HTTP 403 — API key dead/IP-blocked)
           │
           ▼
[B] Deduplication  (src/lib/ingestion/ingest.ts)
    canonical_url hash → upsert (skip if exists)
    content_hash → skip if content unchanged
           │
           ▼
[C] Classification  (src/lib/ingestion/ingest.ts → /api/classify)
    New jobs → Claude Haiku 4.5 → extracts: yearsExperience, educationLevel,
    fieldOfStudy, sphereOfExpertise, seniorityLevel, industry, languages, keySkills
    Batch size: 100 jobs/batch, 5× concurrency, classify-on-ingest (immediate)
           │
           ▼
[D] Jobs stored in Postgres  (table: jobs)
    Classified fields populated → available to match engine
```

## Database Schema (simplified)

```
profiles
  id, email, cvText, yearsExperience, educationLevel, fieldOfStudy,
  sphereOfExpertise, seniorityLevel, industry, languages[], keySkills[],
  prefLocation, prefWorkMode, prefEmploymentType, prefSalaryMin,
  lastSearchAt, restoreToken, createdAt, updatedAt

jobs
  id, title, company, location, url, postedAt, source, canonicalUrl,
  salaryMin, salaryMax, salaryCurrency, employmentType, isRemote,
  yearsExperience, educationLevel, fieldOfStudy, sphereOfExpertise,
  seniorityLevel, industry, languages[], keySkills[],
  isClassified, ingestedAt, createdAt, updatedAt

searches
  id, profileId, resultCount, isDelta, createdAt

search_results
  id, searchId, jobId, matchScore, matchedCriteria[], rank, createdAt
```

## Component Map

| Component | File | Responsibility |
|-----------|------|----------------|
| CV Parser | `src/lib/cv-parser/` | PDF/DOCX → text extraction |
| LLM Extract | `src/lib/llm/extract-cv.ts` | Text → structured profile |
| Match Engine | `src/lib/matching/engine.ts` | Core ranking logic |
| Ingest | `src/lib/ingestion/ingest.ts` | Fetch + dedup + classify jobs |
| Adzuna | `src/lib/ingestion/adzuna.ts` | Adzuna API adapter |
| dev.bg | `src/lib/ingestion/devbg.ts` | dev.bg AJAX scraper |
| jobs.bg | `src/lib/ingestion/jobsbg.ts` | jobs.bg Playwright scraper |
| Jooble | `src/lib/ingestion/jooble.ts` | Jooble API adapter (blocked) |
| Search API | `src/app/api/search/route.ts` | Search endpoint |
| Pipeline API | `src/app/api/pipeline/route.ts` | Ingestion trigger |
| Classify API | `src/app/api/classify/route.ts` | Classification trigger |

## Known Architecture Gaps

1. **No background queue** — Vercel 300s timeout cuts off long ingestion runs (dev.bg fetches ~50s/page)
2. **Match engine scans full table** — no vector index, no Postgres FTS — will not scale past ~50K jobs
3. **Classification model not version-pinned** — Haiku 4.5 model changes can silently shift classification quality
4. **No observability** — no logging of search quality metrics, no A/B comparison of ranking changes

See also: [RANKING-ALGORITHM.md](./RANKING-ALGORITHM.md), [INGESTION-PIPELINE.md](./INGESTION-PIPELINE.md), [PREFERENCE-SYSTEM.md](./PREFERENCE-SYSTEM.md)
