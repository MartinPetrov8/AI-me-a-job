# System Architecture — aimeajob

## High-Level Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser    │────▶│   Vercel Edge    │────▶│  Postgres   │
│  (Next.js)   │◀────│  (API Routes)    │◀────│ (Supabase)  │
└─────────────┘     └──────┬───────────┘     └─────────────┘
                           │
                    ┌──────▼───────────┐
                    │   LLM Service    │
                    │ (Mac Studio /    │
                    │  GPT-4o-mini)    │
                    └──────────────────┘

┌──────────────────────────────────────┐
│         Job Ingestion Cron           │
│  Adzuna + Jooble + EURES → LLM →    │
│  Classified jobs → Postgres          │
└──────────────────────────────────────┘
```

---

## Components

### 1. Frontend — Next.js on Vercel

**Technology:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
**Why:** SSR for landing page SEO, API routes co-located, Vercel auto-scales, great mobile DX.

**Pages/Routes:**
| Route | Purpose |
|-------|---------|
| `/` | Landing page (SSR, static-cacheable) |
| `/upload` | CV upload + extraction flow |
| `/profile` | Review/edit extracted criteria |
| `/preferences` | Preference questions |
| `/results` | Matched jobs display |
| `/results?delta=true` | 24h delta results |

**Input:** User interactions (file upload, form edits, button clicks)
**Output:** Rendered pages with data from API routes

**Error handling:** 
- Upload failures: retry prompt with clear error message
- Extraction timeout: "Taking longer than expected, please wait" with 60s ceiling
- Empty results: Helpful message, not blank page

### 2. API Routes — Vercel Serverless Functions

Co-located with frontend in Next.js. Stateless, each request independent.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Accept CV file, trigger extraction |
| `/api/profile` | GET/PUT | Read/update profile criteria |
| `/api/preferences` | PUT | Save preference answers |
| `/api/search` | POST | Execute matching query |
| `/api/search/delta` | POST | Execute 24h delta search |
| `/api/save` | POST | Save profile via email |
| `/api/restore` | POST | Restore profile by email |

**Input:** JSON/FormData from frontend
**Output:** JSON responses in standard envelope: `{ data, meta, errors }`

**Error handling:**
- Input validation at every endpoint (zod schemas)
- 400 for bad input, 404 for missing resources, 500 with generic message (no internals leaked)
- Rate limiting: 10 uploads/hour per IP, 30 searches/hour per IP

### 3. LLM Service

**Prototype phase:** OpenAI GPT-4o-mini via API (fast, cheap, good enough for structured extraction)
**Production phase:** Local model on Mac Studio M4 Max (128GB) via Ollama or llama.cpp

**Two distinct LLM tasks:**

#### Task A: CV Extraction (user-facing, synchronous)
- Input: Raw CV text (extracted from PDF/DOCX)
- Output: JSON with 8 structured criteria
- Latency target: <15 seconds
- Prompt: System prompt with exact schema + bounded category lists + examples
- Fallback: If extraction confidence is low, leave field blank → user fills manually

#### Task B: Job Classification (background, batch)
- Input: Job posting title + description
- Output: JSON with 8 structured criteria
- Latency: Not user-facing, can be slower
- Batch: Process 50-100 postings per cron run
- Prompt: Same schema as CV extraction, adapted for job posting context

**Both tasks use the same 8-criteria schema.** This is what makes matching a pure DB comparison.

**Error handling:**
- LLM timeout: 30s per call, retry 2x
- Malformed JSON response: retry with stricter prompt
- After 3 failures: skip item, log for manual review

### 4. Job Ingestion Pipeline (Cron)

**Schedule:** Every 6 hours (4x daily)
**Technology:** Long-running Node.js script triggered by OpenClaw cron (NOT Vercel serverless — would timeout at 10-60s)
**Runtime:** Mac Studio or Docker container. Must support multi-minute execution for LLM batch classification.

**Flow:**
```
For each API source (Adzuna, Jooble, EURES):
  1. Fetch new postings (paginated)
  2. Deduplicate against existing jobs (source + external_id)
  3. For new postings: classify via LLM (Task B)
  4. Upsert to Postgres
  5. Log: count ingested, count classified, errors

Post-ingestion cleanup:
  6. DELETE jobs WHERE posted_at < NOW() - INTERVAL '30 days'
  7. Truncate description_raw for jobs older than 7 days (save storage)
  8. Log: count deleted, current DB size
```

**Input:** API responses from job boards
**Output:** Classified job records in Postgres

**Data retention:**
- Jobs older than 30 days: deleted entirely
- Jobs 7-30 days old: description_raw truncated to save storage
- Supabase free tier is 500MB — with 30-day retention, estimated ~100-200MB steady state

**Error handling:**
- API down: skip source, log warning, continue with others
- Rate limits: respect per-API limits (Adzuna: 250/day free, Jooble: 500/day, EURES: unlimited)
- LLM classification failure: store job without classification, retry next run

### 5. Matching Engine (Pure SQL)

**Not a separate service** — lives as a database query called by the API route.

**Algorithm:**
```sql
-- For each job, count how many of the 8 criteria match the profile
-- Filter: match_score >= 5 (Nikolay's 5/8 threshold)
-- Order: match_score DESC, posted_at DESC
-- Limit: 50 results
```

**Matching rules per criterion:**
| Criterion | Match logic |
|-----------|------------|
| years_experience | Exact match OR adjacent bucket (e.g., "5-9" matches "5-9" and partially "10-15") |
| education_level | Profile >= Job requirement |
| field_of_study | Exact match |
| sphere_of_expertise | Exact match |
| seniority_level | Exact match OR ±1 level |
| languages | Job's required languages ⊆ Profile's languages |
| industry | Exact match |
| key_skills | Intersection count ≥ 2 of profile skills vs job skills (uses `&&` operator + GIN index) |

**Critical indexes for array matching:** `key_skills` and `languages` columns require GIN indexes (not B-tree). B-tree cannot search inside Postgres arrays — without GIN, array operations force full table scans. See DATA_MODEL.md for index definitions.

**Match transparency:** Each result includes `matched_criteria[]` showing which dimensions aligned. Displayed to user per Nikolay's request.

**Delta search:** Same query + `WHERE jobs.ingested_at > profile.last_search_at`

**Error handling:** Query timeout at 5s. GIN indexes keep array queries under 100ms at 100K rows.

### 6. Database — Postgres (Supabase)

**Why Supabase:** Free tier generous (500MB, 50K rows), Postgres-native, built-in connection pooling, row-level security available if needed later.

**Why not SQLite:** Multi-user concurrent access, Vercel serverless functions need external DB.

**Connection:** Via Supabase connection string, pooled mode for serverless.

---

## Data Flow: User Journey

```
1. User lands on /
2. Clicks "Upload CV" → /upload
3. Uploads PDF → POST /api/upload
   → Extract text from PDF (pdf-parse library)
   → Send text to LLM (Task A: CV Extraction)
   → Return 8 criteria as JSON
4. Redirect to /profile with extracted data
5. User reviews, edits → PUT /api/profile
   → Upsert profile to DB
6. Redirect to /preferences
7. User answers preferences → PUT /api/preferences
   → Update profile with preferences
8. Click "Find Jobs" → POST /api/search
   → Matching engine query (SQL)
   → Return ranked results with match breakdown
9. Show results on /results
10. (Optional) Enter email → POST /api/save
11. (Return visit) Enter email → POST /api/restore → /results?delta=true
```

---

## Security Considerations (MVP)

- No auth = no session hijacking risk
- File upload: validate MIME type, max 10MB, scan for obviously non-CV content
- Email: stored plain (no auth = no password to protect). Can add hashing later.
- API routes: rate limiting per IP
- DB: parameterized queries only (Drizzle ORM handles this)
- LLM prompts: no user-controlled system prompts
- CV text: stored only if user saves profile (email). Otherwise ephemeral.

---

## Scalability Notes

**At 10 users/day:** Everything free tier. LLM costs ~$0.10/day.
**At 100 users/day:** Still free tier for hosting. LLM costs ~$1/day.  
**At 1000 users/day:** May need Supabase Pro ($25/mo). LLM on Mac Studio = $0.
**At 10K users/day:** Vercel Pro ($20/mo). Supabase Pro. All matching is DB queries = scales linearly.

The expensive part (LLM) is bounded:
- CV extraction: 1 call per upload (user-facing)
- Job classification: at ingestion only (amortized across all users)
- Matching: zero LLM cost (pure SQL)
