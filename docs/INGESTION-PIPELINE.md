# aimeajob — Ingestion Pipeline

## Overview

Jobs are ingested from external sources daily via a Vercel cron (`/api/pipeline`, 06:00 UTC).
After ingestion, new jobs are immediately classified by an LLM before being stored.

Current DB state: ~4,163 jobs (as of 2026-03-16)

---

## Sources

| Source | Status | Mechanism | Coverage | Jobs |
|--------|--------|-----------|----------|------|
| Adzuna | ✅ Live | REST API | GB, US, DE, FR, NL, AU, BG | ~4,143 |
| dev.bg | ✅ Live | AJAX scrape | Bulgaria | ~20 (only page 1 — timeout) |
| jobs.bg | ⚠️ Local only | Playwright stealth | Bulgaria | 0 on Vercel |
| Jooble | ❌ Blocked | REST API | Multi-country | 0 (HTTP 403) |
| Reed | 📋 Planned | REST API | UK | — |
| EURES | 📋 Planned | REST API | EU | — |

---

## Ingestion Flow

```
/api/pipeline?source=adzuna|jooble|devbg|jobsbg&classify=true
      │
      ├── [1] Fetch jobs from source API/scraper
      │         Adzuna: paginated API (100/page, up to 10 pages/country)
      │         dev.bg: AJAX POST to /wp-admin/admin-ajax.php
      │         jobs.bg: Playwright (chromium headless, stealth mode)
      │         Jooble: REST API (currently returning 403)
      │
      ├── [2] Deduplication (per job)
      │         canonical_url → sha256 hash → check jobs table
      │         If exists: skip (upsert noop)
      │         If new: insert with is_classified=false
      │
      ├── [3] Classify-on-ingest (immediate, for new jobs only)
      │         Batch size: 100 jobs
      │         Concurrency: 5 parallel LLM calls
      │         Model: Claude Haiku 4.5 (anthropic/claude-haiku-4-5)
      │         Prompt: extracts 8 structured fields from title + description
      │         On success: update job, set is_classified=true
      │         On failure: job stays with is_classified=false (backlog)
      │
      └── [4] Backlog classification (separate endpoint)
              /api/pipeline?classify=true (without source)
              Picks up is_classified=false jobs
              Cap: 500 jobs per run
```

---

## Classification

### Model
Claude Haiku 4.5 (`anthropic/claude-haiku-4-5`) — chosen for speed + cost (not quality).

### Fields extracted
From job title + description:
- `yearsExperience` — one of the YEARS_EXPERIENCE bands
- `educationLevel` — one of the EDUCATION_LEVELS
- `fieldOfStudy` — free text (often null)
- `sphereOfExpertise` — free text (often null)
- `seniorityLevel` — one of the SENIORITY_LEVELS
- `industry` — free text
- `languages` — array of programming/spoken languages
- `keySkills` — array of skills mentioned

### Known Classification Issues
1. **Null inflation** — model returns null for most fields when unsure → jobs score high by having all null (see RANKING-ALGORITHM.md)
2. **Inconsistent normalisation** — "Software Engineering" vs "Software Development" both extracted, not normalized
3. **No validation** — classification output not validated against enum values in criteria.ts
4. **No versioning** — model changes silently shift classification quality across the corpus

---

## Deduplication

```typescript
// canonical_url used as the dedup key
// Upsert: if canonical_url exists, skip (no update to avoid overwriting classification)
// content_hash: sha256 of title+company+location — used to detect changed jobs
```

**Known gap:** dev.bg and jobs.bg don't have canonical URLs — they use page URLs which change.
Dedup falls back to title+company match (imperfect).

---

## Failure Modes

| Failure | Impact | Current handling |
|---------|--------|-----------------|
| Vercel 300s timeout | dev.bg truncated to 1 page, Jooble/EURES may be cut | Chunked pipeline (`?source=X`) |
| Adzuna rate limit | Partial ingestion | No retry — silent loss |
| Classification LLM failure | Job left unclassified | Backlog pick-up on next run |
| Playwright on Vercel | jobs.bg returns [] | No fix — needs background worker |
| Jooble 403 | Zero Jooble jobs | Investigate: key expired? IP-blocked? |

---

## Running Manually

```bash
# Trigger ingestion for a specific source
curl -X POST "https://aimeajob.vercel.app/api/pipeline?source=adzuna" \
  -H "x-cron-secret: $CRON_SECRET"

# Classify backlog
curl -X POST "https://aimeajob.vercel.app/api/pipeline?classify=true" \
  -H "x-cron-secret: $CRON_SECRET"

# Local (from repo root)
CRON_SECRET=xxx node -e "require('./scripts/run-pipeline')"
```
