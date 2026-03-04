# Sprint Plan — aimeajob MVP

## Execution Model

Each sprint = one Antfarm `feature-dev` workflow run.
Each task below = the TASK payload passed to `antfarm workflow run feature-dev "<task>"`.
The planner decomposes the task into stories (max 20). Each story must fit one developer session.

**Hard constraints:**
- 30-minute timeout per agent step
- Each story ≤ 2000 lines of context
- All acceptance criteria must be mechanically verifiable (exit code, grep, curl, file exists)
- No subjective criteria ("looks good", "mobile-friendly")
- Critical schema/type definitions MUST be inlined in the task — agents don't have access to our docs/ folder

**Repo:** Will be created at `~/workspace/projects/ai-job-matcher/` (or GitHub repo TBD)

---

## SPRINT 1: "Foundation"

**One Antfarm run. Goal: project skeleton + DB schema + constants + seed data.**

### TASK (verbatim handoff to Antfarm):

```
PROJECT: aimeajob — AI job matching web app
REPO: [TBD — path or GitHub URL]

OBJECTIVE: Initialize a Next.js 14+ project with TypeScript, Tailwind CSS, and
Drizzle ORM connected to Supabase Postgres. Create the full database schema,
bounded category constants, Zod validation schemas, and seed data.

TECH STACK:
- Next.js 14+ (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Drizzle ORM (postgres-js driver)
- Supabase Postgres (connection string via DATABASE_URL env var)
- Zod for validation
- Vitest for testing

FOLDER STRUCTURE (create exactly this):
src/
  app/
    layout.tsx          # Root layout
    page.tsx            # Placeholder landing page (just "aimeajob" h1)
    globals.css         # Tailwind imports
  lib/
    db/
      schema.ts         # Drizzle schema (ALL 5 tables below)
      index.ts          # DB connection (uses DATABASE_URL env var)
    criteria.ts         # All bounded category constants (see CRITERIA below)
    validation.ts       # Zod schemas for profile input + preferences input
scripts/
  seed.ts               # Seed script (3 profiles + 50 jobs)
tests/
  lib/
    criteria.test.ts    # Tests that all criteria arrays are non-empty and have no duplicates
    validation.test.ts  # Tests that Zod schemas accept valid input and reject invalid
  fixtures/
    sample-jobs.json    # 20 pre-classified job objects

DATABASE SCHEMA (Drizzle — create ALL 5 tables):

Table: users
- id: uuid, primary key, default gen_random_uuid()
- email: text, nullable, unique
- restore_token: text, nullable
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()

Table: profiles (one per user)
- id: uuid, primary key
- user_id: uuid, not null, FK → users(id) ON DELETE CASCADE, unique
- cv_filename: text, not null
- cv_raw_text: text, nullable
- years_experience: text, not null, CHECK IN ('0-1','2-4','5-9','10-15','15+')
- education_level: text, not null, CHECK IN ('High school','Bachelors','Masters','PhD')
- field_of_study: text, not null, CHECK IN (12 values — see CRITERIA)
- sphere_of_expertise: text, not null, CHECK IN (15 values — see CRITERIA)
- seniority_level: text, not null, CHECK IN ('Entry','Junior','Mid','Senior','Lead/Manager','Director+')
- languages: text[], not null
- industry: text, not null, CHECK IN (15 values — see CRITERIA)
- key_skills: text[], not null
- pref_employment_type: text[], nullable
- pref_location: text, nullable
- pref_work_mode: text, nullable, CHECK IN ('Remote','Hybrid','On-site','Any')
- pref_relocation: boolean, nullable
- pref_salary_min: integer, nullable
- pref_salary_max: integer, nullable
- pref_salary_currency: text, nullable
- last_search_at: timestamptz, nullable
- created_at: timestamptz, not null, default now()
- updated_at: timestamptz, not null, default now()

Table: jobs
- id: uuid, primary key
- external_id: text, not null
- source: text, not null, CHECK IN ('adzuna','jooble','eures')
- title: text, not null
- company: text, nullable
- location: text, nullable
- country: text, nullable
- url: text, not null
- description_raw: text, not null
- salary_min: integer, nullable
- salary_max: integer, nullable
- salary_currency: text, nullable
- employment_type: text, nullable
- is_remote: boolean, nullable
- posted_at: timestamptz, nullable
- expires_at: timestamptz, nullable
- years_experience: text, nullable (same CHECK as profiles)
- education_level: text, nullable (same CHECK as profiles)
- field_of_study: text, nullable (same CHECK as profiles)
- sphere_of_expertise: text, nullable (same CHECK as profiles)
- seniority_level: text, nullable (same CHECK as profiles)
- languages: text[], nullable
- industry: text, nullable (same CHECK as profiles)
- key_skills: text[], nullable
- classified_at: timestamptz, nullable
- ingested_at: timestamptz, not null, default now()
UNIQUE constraint: (source, external_id)
B-tree indexes: source+external_id, industry, seniority_level, sphere_of_expertise, posted_at, country
GIN indexes: key_skills, languages (required for array overlap/containment operators)

Table: searches
- id: uuid, primary key
- profile_id: uuid, not null, FK → profiles(id) ON DELETE CASCADE
- searched_at: timestamptz, not null, default now()
- result_count: integer, not null
- is_delta: boolean, not null, default false

Table: search_results
- id: uuid, primary key
- search_id: uuid, not null, FK → searches(id) ON DELETE CASCADE
- job_id: uuid, not null, FK → jobs(id) ON DELETE CASCADE
- match_score: integer, not null, CHECK BETWEEN 0 AND 8
- matched_criteria: text[], not null
- rank: integer, not null
UNIQUE constraint: (search_id, job_id)

CRITERIA CONSTANTS (export as typed const arrays in src/lib/criteria.ts):

YEARS_EXPERIENCE = ['0-1', '2-4', '5-9', '10-15', '15+']

EDUCATION_LEVELS = ['High school', 'Bachelors', 'Masters', 'PhD']

FIELDS_OF_STUDY = ['STEM', 'Business & Economics', 'Law', 'Medicine & Health',
  'Social Sciences', 'Humanities', 'Arts & Design', 'Education',
  'Agriculture & Environment', 'Communications & Media', 'Trades & Technical', 'Other']

SPHERES_OF_EXPERTISE = ['Data Science', 'Sales', 'HR', 'Engineering', 'Marketing',
  'Finance', 'Operations', 'Product', 'Design', 'Legal', 'Healthcare',
  'Education', 'IT/DevOps', 'Consulting', 'Other']

SENIORITY_LEVELS = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead/Manager', 'Director+']

INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare', 'Manufacturing',
  'Retail & E-commerce', 'Consulting', 'Telecom', 'Energy', 'Real Estate',
  'Government', 'Education', 'Media & Entertainment', 'Logistics & Transport',
  'Hospitality', 'Other']

WORK_MODES = ['Remote', 'Hybrid', 'On-site', 'Any']

EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance']

JOB_SOURCES = ['adzuna', 'jooble', 'eures']

Also export TypeScript types derived from these arrays (e.g., type YearsExperience = typeof YEARS_EXPERIENCE[number]).

ZOD SCHEMAS (in src/lib/validation.ts):
- profileInputSchema: validates all 8 criteria fields (required, must be from bounded lists)
- preferencesInputSchema: validates preferences (all optional)
- Both schemas should use z.enum() referencing the criteria constants

SEED DATA (scripts/seed.ts):
- 3 user+profile records with different seniority/industry combinations
- 50 job records: at least 5 industries, 4 seniority levels, mix of classified and unclassified
- Jobs must have realistic titles and companies (can be fictional but plausible)
- At least 10 jobs should have classified_at = null (to test classification pipeline later)

TEST FIXTURES (tests/fixtures/sample-jobs.json):
- 20 job objects matching the jobs table schema
- All 20 must have all 8 criteria classified (non-null)
- Cover at least 4 industries, 3 seniority levels

ENV VARS (.env.example):
DATABASE_URL=postgresql://user:pass@host:5432/dbname

VERIFICATION (the agent must run ALL of these before marking done):
1. `npx tsc --noEmit` exits 0 (no type errors)
2. `npx vitest run` exits 0 (all tests pass)
3. `npx drizzle-kit generate` produces migration files without errors
4. criteria.test.ts verifies: each criteria array has no duplicates, length matches expected count
5. validation.test.ts verifies: valid profile input passes, invalid field value rejects, missing required field rejects
6. seed.ts: can be parsed by TypeScript without errors (npx tsx --check scripts/seed.ts)
7. sample-jobs.json: parseable, has 20 entries, all have non-null criteria fields
```

**Estimated stories:** 4-6 (schema, criteria+validation, seed, tests, placeholder pages)
**Risk:** Low — no external APIs, no LLM calls, pure scaffolding.

---

## SPRINT 2: "CV Upload + Extraction"

**One Antfarm run. Goal: user uploads PDF/DOCX → text extracted → LLM classifies → 8 criteria returned.**

### TASK (verbatim handoff):

```
PROJECT: aimeajob — AI job matching web app
REPO: [path from Sprint 1]

OBJECTIVE: Build the CV upload page, file text extraction (PDF + DOCX),
and LLM-powered criteria extraction using OpenAI GPT-4o-mini.

DEPENDS ON: Sprint 1 must be complete (schema, criteria constants, validation schemas exist).

EXISTING CODE CONTEXT:
- src/lib/criteria.ts — all bounded category arrays + TypeScript types
- src/lib/validation.ts — Zod schemas for profile + preferences
- src/lib/db/schema.ts — Drizzle schema for all tables
- src/lib/db/index.ts — DB connection

WHAT TO BUILD:

1. FILE TEXT EXTRACTION (src/lib/cv-parser/extract-text.ts):
   - Function: extractText(buffer: Buffer, mimeType: string): Promise<string>
   - PDF extraction using 'pdf-parse' npm package
   - DOCX extraction using 'mammoth' npm package
   - Validates MIME type is application/pdf or application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - Throws typed error for unsupported formats
   - Throws typed error if extracted text is empty or < 50 characters

2. LLM CV EXTRACTION (src/lib/llm/):
   - src/lib/llm/client.ts — OpenAI client wrapper (uses OPENAI_API_KEY env var)
   - src/lib/llm/prompts.ts — System prompt for CV extraction:
     * Must list ALL bounded categories inline in the prompt
     * Must request JSON output matching the 8-criteria schema
     * Must instruct: "If a criterion cannot be determined, set it to null"
   - src/lib/llm/extract-cv.ts:
     * Function: extractCvCriteria(rawText: string): Promise<ExtractedCriteria>
     * Uses GPT-4o-mini with response_format: { type: "json_object" }
     * Timeout: 30 seconds per call
     * Retry: 2 attempts on timeout or malformed JSON
     * Returns typed object with all 8 criteria (nullable fields for uncertain ones)
     * Validates returned values against criteria constants (rejects hallucinated categories)
   - ExtractedCriteria type:
     {
       years_experience: string | null  // must be from YEARS_EXPERIENCE
       education_level: string | null   // must be from EDUCATION_LEVELS
       field_of_study: string | null    // must be from FIELDS_OF_STUDY
       sphere_of_expertise: string | null
       seniority_level: string | null
       languages: string[] | null
       industry: string | null
       key_skills: string[] | null
     }

3. UPLOAD API ROUTE (src/app/api/upload/route.ts):
   - POST handler
   - Accepts multipart/form-data with 'file' field
   - Validates: file exists, MIME type is PDF or DOCX, size ≤ 10MB
   - Calls extractText() → extractCvCriteria()
   - Creates user + profile records in DB (criteria fields that are null stay null in DB)
   - Returns JSON: { data: { user_id, profile_id, extracted: ExtractedCriteria } }
   - Error responses: 400 (bad file), 422 (extraction failed), 503 (LLM unavailable)

4. UPLOAD PAGE (src/app/upload/page.tsx):
   - Client component with file input
   - Drag-and-drop zone + click-to-browse button
   - Shows file name after selection
   - "Extract" button calls POST /api/upload
   - Loading spinner during extraction (text: "Analyzing your CV...")
   - On success: redirects to /profile?user_id=<uuid>&profile_id=<uuid>
   - On error: shows error message inline (red text below upload zone)
   - Accepts only .pdf and .docx files (HTML accept attribute)

5. PROFILE API ROUTE (src/app/api/profile/route.ts):
   - GET handler: takes user_id query param, returns profile with criteria
   - PUT handler: takes profile_id in body + criteria fields, updates profile
   - Validates criteria values against bounded lists using Zod schema
   - Returns JSON envelope: { data: { profile_id, criteria: {...} } }

PACKAGES TO INSTALL:
- pdf-parse
- mammoth
- openai
- @types/pdf-parse (if needed)

ENV VARS TO ADD to .env.example:
OPENAI_API_KEY=sk-...

TESTS TO WRITE:

tests/lib/extract-text.test.ts:
- Test: PDF buffer → returns non-empty string
- Test: DOCX buffer → returns non-empty string
- Test: unsupported MIME type → throws error
- Test: empty document → throws error
(Use small test fixture files in tests/fixtures/)

tests/lib/extract-cv.test.ts (MOCK the OpenAI client — do NOT make real API calls in tests):
- Test: valid LLM response → returns typed ExtractedCriteria
- Test: LLM returns value not in bounded list → that field set to null
- Test: LLM returns malformed JSON → retries (mock 2 calls: first bad, second good)
- Test: LLM timeout → retries then throws after 2 failures

tests/api/upload.test.ts:
- Test: valid PDF upload → 200 + user_id + profile_id + extracted criteria
- Test: no file → 400
- Test: file too large → 400
- Test: invalid MIME type → 400
(These can mock the LLM layer)

VERIFICATION (agent must run ALL before marking done):
1. `npx tsc --noEmit` exits 0
2. `npx vitest run` exits 0 — ALL tests pass
3. `curl -X POST http://localhost:3000/api/upload` with no file → returns 400 JSON
4. Upload page renders at http://localhost:3000/upload (check with curl that HTML is returned)
5. No console.log or debugger statements in production code (grep check)
```

**Estimated stories:** 5-7 (text extraction, LLM client, extraction logic, API route, upload page, profile API, tests)
**Risk:** Medium — LLM integration. Mitigated by mocked tests + structured output mode.

---

## SPRINT 3: "Profile UI + Preferences"

**One Antfarm run. Goal: user reviews/edits extracted criteria, answers preference questions.**

### TASK (verbatim handoff):

```
PROJECT: aimeajob — AI job matching web app
REPO: [path]

OBJECTIVE: Build the profile review/edit page and preferences page.
User sees AI-extracted criteria, can edit via dropdowns/tags, confirms,
then answers optional preference questions.

DEPENDS ON: Sprint 2 complete (upload flow, profile API, criteria constants).

EXISTING CODE:
- src/lib/criteria.ts — YEARS_EXPERIENCE, EDUCATION_LEVELS, FIELDS_OF_STUDY,
  SPHERES_OF_EXPERTISE, SENIORITY_LEVELS, INDUSTRIES, WORK_MODES, EMPLOYMENT_TYPES
  (all as const arrays with derived TypeScript types)
- src/lib/validation.ts — profileInputSchema, preferencesInputSchema (Zod)
- src/app/api/profile/route.ts — GET (by user_id) and PUT (update criteria)
- src/lib/db/schema.ts — profiles table with all fields

WHAT TO BUILD:

1. PROFILE PAGE (src/app/profile/page.tsx):
   - Reads user_id and profile_id from URL query params
   - Fetches profile via GET /api/profile?user_id=<id>
   - Displays all 8 criteria in an editable form:
     * years_experience: <select> dropdown with YEARS_EXPERIENCE options
     * education_level: <select> dropdown with EDUCATION_LEVELS options
     * field_of_study: <select> dropdown with FIELDS_OF_STUDY options
     * sphere_of_expertise: <select> dropdown with SPHERES_OF_EXPERTISE options
     * seniority_level: <select> dropdown with SENIORITY_LEVELS options
     * languages: tag input (type to add, click X to remove)
     * industry: <select> dropdown with INDUSTRIES options
     * key_skills: tag input (type to add, click X to remove, max 10)
   - Fields that are null (LLM couldn't determine) shown with yellow background
     and placeholder text "Not detected — please select"
   - "Confirm & Continue" button: calls PUT /api/profile, then redirects to
     /preferences?user_id=<id>&profile_id=<id>
   - Button disabled until all required fields (non-null) are filled
   - Validation errors shown inline per field (red text)

2. TAG INPUT COMPONENT (src/components/tag-input.tsx):
   - Reusable component for languages and key_skills
   - Props: value: string[], onChange: (tags: string[]) => void, max?: number, placeholder?: string
   - Text input + "Add" button (or Enter key)
   - Each tag shown as pill with X remove button
   - Prevents duplicates (case-insensitive)
   - Enforces max limit (shows "Maximum X reached" when at limit)

3. PREFERENCES PAGE (src/app/preferences/page.tsx):
   - Reads user_id and profile_id from URL query params
   - Form with 5 optional preference fields:
     * Employment type: checkbox group (Full-time, Part-time, Contract, Freelance) — multi-select
     * Location: text input with placeholder "e.g. Berlin, Germany or Anywhere"
     * Work mode: radio buttons (Remote, Hybrid, On-site, Any)
     * Relocation: radio buttons (Yes, No)
     * Salary range: two number inputs (min, max) + currency dropdown (EUR, USD, GBP) — all optional
   - "Skip" link (goes to /results without saving preferences)
   - "Find Jobs" button: calls PUT /api/preferences, redirects to
     /results?user_id=<id>&profile_id=<id>

4. PREFERENCES API ROUTE (src/app/api/preferences/route.ts):
   - PUT handler: takes profile_id + preference fields
   - Validates with preferencesInputSchema
   - Updates profile record in DB
   - Returns updated profile JSON

STYLING:
- Use Tailwind CSS utility classes only
- Max width 640px centered container (mobile-first)
- White background, gray-50 card for the form
- Blue-600 primary buttons, gray-300 borders
- Font: system font stack (no custom fonts)
- All form elements: full width, 44px min touch target height

TESTS:

tests/components/tag-input.test.tsx:
- Test: renders with initial tags
- Test: adding a tag updates the list
- Test: removing a tag updates the list
- Test: duplicate tag not added
- Test: max limit enforced
(Use @testing-library/react + vitest)

tests/api/preferences.test.ts:
- Test: PUT with valid preferences → 200 + updated profile
- Test: PUT with invalid work_mode value → 400
- Test: PUT with no preferences (all optional) → 200

VERIFICATION:
1. `npx tsc --noEmit` exits 0
2. `npx vitest run` exits 0
3. Profile page loads at /profile (returns HTML with form elements — verify with curl)
4. Preferences page loads at /preferences (returns HTML)
5. No hardcoded criteria values in page components (must import from criteria.ts)
   Verify: grep -r "High school\|Bachelors\|Masters\|PhD" src/app/ should return 0 results
   (values must come from criteria.ts imports, not hardcoded strings)
```

**Estimated stories:** 4-5 (tag input component, profile page, preferences page, preferences API, tests)
**Risk:** Low — pure frontend + simple API. No external dependencies.

---

## SPRINT 4: "Job Ingestion"

**One Antfarm run. Goal: fetch jobs from Adzuna + Jooble APIs, store in DB.**

### TASK (verbatim handoff):

```
PROJECT: aimeajob — AI job matching web app
REPO: [path]

OBJECTIVE: Build job ingestion clients for Adzuna and Jooble APIs.
Fetch postings, normalize to common format, deduplicate, upsert to Postgres.
Include data retention cleanup (delete jobs > 30 days old).

DEPENDS ON: Sprint 1 complete (DB schema with jobs table).

EXISTING CODE:
- src/lib/db/schema.ts — jobs table with all fields including GIN indexes
- src/lib/db/index.ts — DB connection
- src/lib/criteria.ts — JOB_SOURCES constant

WHAT TO BUILD:

1. SHARED TYPES (src/lib/ingestion/types.ts):
   - RawJobPosting interface (normalized format both APIs map to):
     {
       external_id: string
       source: 'adzuna' | 'jooble'
       title: string
       company: string | null
       location: string | null
       country: string | null
       url: string
       description_raw: string
       salary_min: number | null
       salary_max: number | null
       salary_currency: string | null
       employment_type: string | null
       is_remote: boolean | null
       posted_at: Date | null
     }
   - IngestionResult interface:
     { source: string, fetched: number, new: number, errors: number, deleted: number }

2. ADZUNA CLIENT (src/lib/ingestion/adzuna.ts):
   - Function: fetchAdzunaJobs(country: string, page: number): Promise<RawJobPosting[]>
   - Uses Adzuna API v1: GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}
   - Query params: app_id (ADZUNA_APP_ID env), app_key (ADZUNA_APP_KEY env), results_per_page=50
   - Maps Adzuna response fields to RawJobPosting
   - Countries to fetch: gb, us, de, fr, nl, au
   - Timeout: 30 seconds per request
   - Error handling: log and skip on failure, don't throw

3. JOOBLE CLIENT (src/lib/ingestion/jooble.ts):
   - Function: fetchJoobleJobs(keywords: string, location: string): Promise<RawJobPosting[]>
   - Uses Jooble API: POST https://jooble.org/api/{JOOBLE_API_KEY}
   - Body: { keywords, location, page }
   - Maps Jooble response to RawJobPosting
   - Timeout: 30 seconds
   - Error handling: log and skip on failure

4. INGESTION ORCHESTRATOR (src/lib/ingestion/ingest.ts):
   - Function: ingestAllSources(): Promise<IngestionResult[]>
   - For each source: fetch → deduplicate → upsert
   - Dedup: check (source, external_id) exists before inserting
   - Upsert: INSERT ... ON CONFLICT (source, external_id) DO UPDATE
   - After ingestion: DELETE FROM jobs WHERE posted_at < NOW() - INTERVAL '30 days'
   - After ingestion: UPDATE jobs SET description_raw = '' WHERE posted_at < NOW() - INTERVAL '7 days' AND description_raw != ''
   - Returns array of IngestionResult (one per source)
   - Logs totals to console

5. INGESTION SCRIPT (scripts/ingest-jobs.ts):
   - Entry point: npx tsx scripts/ingest-jobs.ts
   - Calls ingestAllSources()
   - Prints summary table to stdout
   - Exits with code 0 on success, 1 if all sources failed

ENV VARS TO ADD:
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
JOOBLE_API_KEY=...

TESTS (mock ALL external API calls — do NOT hit real APIs in tests):

tests/lib/ingestion/adzuna.test.ts:
- Test: valid API response → returns array of RawJobPosting with correct field mapping
- Test: API returns 429 → returns empty array (no throw)
- Test: API timeout → returns empty array (no throw)
- Mock: use vitest mock to intercept fetch/axios calls

tests/lib/ingestion/jooble.test.ts:
- Test: valid API response → returns array of RawJobPosting
- Test: API error → returns empty array

tests/lib/ingestion/ingest.test.ts:
- Test: 2 new jobs ingested → both inserted, result.new = 2
- Test: duplicate job (same source + external_id) → upserted, not duplicated
- Test: job older than 30 days → deleted after ingestion
- Test: job 7-30 days old → description_raw truncated to empty string
- Mock: mock both API clients to return fixture data, use real DB (test database)

VERIFICATION:
1. `npx tsc --noEmit` exits 0
2. `npx vitest run` exits 0
3. `npx tsx --check scripts/ingest-jobs.ts` exits 0 (parses without error)
4. No API keys hardcoded in source (grep -r "ADZUNA\|JOOBLE" src/ should only show process.env references)
5. ingest.ts imports from types.ts (not defining its own types)
```

**Estimated stories:** 5-6 (types, adzuna client, jooble client, orchestrator, cleanup logic, script + tests)
**Risk:** Medium — external API format may differ from docs. Tests are mocked so this runs without real API keys.

---

## SPRINT 5: "Job Classification"

**One Antfarm run. Goal: classify unclassified jobs via LLM using same 8-criteria schema.**

### TASK (verbatim handoff):

```
PROJECT: aimeajob — AI job matching web app
REPO: [path]

OBJECTIVE: Build batch LLM classification for job postings.
Take unclassified jobs from DB, send title+description to GPT-4o-mini,
extract 8 criteria using same bounded categories as CV extraction,
update job records with classified values.

DEPENDS ON: Sprint 2 (LLM client + prompts exist), Sprint 4 (jobs table populated).

EXISTING CODE:
- src/lib/llm/client.ts — OpenAI client wrapper
- src/lib/llm/prompts.ts — CV extraction prompt (reuse pattern for jobs)
- src/lib/criteria.ts — all bounded category constants
- src/lib/db/schema.ts — jobs table with criteria fields + classified_at

WHAT TO BUILD:

1. JOB CLASSIFICATION (src/lib/llm/classify-job.ts):
   - Function: classifyJob(title: string, description: string): Promise<ClassifiedCriteria>
   - ClassifiedCriteria type: same as ExtractedCriteria from extract-cv.ts
     (years_experience, education_level, field_of_study, sphere_of_expertise,
      seniority_level, languages, industry, key_skills — all nullable)
   - Uses GPT-4o-mini with response_format: { type: "json_object" }
   - System prompt: similar to CV extraction but adapted for job postings
     ("Extract the requirements/qualifications from this job posting...")
   - Must list all bounded categories inline in prompt
   - Validates returned values against criteria constants
   - Timeout: 30 seconds, retry 2x
   - Returns null fields for criteria that can't be determined

2. BATCH CLASSIFIER (src/lib/llm/batch-classify.ts):
   - Function: classifyUnclassifiedJobs(batchSize: number = 50): Promise<BatchResult>
   - Queries: SELECT * FROM jobs WHERE classified_at IS NULL LIMIT batchSize
   - For each job: calls classifyJob(title, description_raw)
   - Updates job record: SET years_experience=..., ..., classified_at=NOW()
   - If classifyJob fails for a specific job: log error, skip, continue to next
   - Returns BatchResult: { total: number, classified: number, failed: number, errors: string[] }
   - Processes sequentially (not parallel) to respect API rate limits

3. CLASSIFICATION SCRIPT (scripts/classify-jobs.ts):
   - Entry point: npx tsx scripts/classify-jobs.ts [--batch-size 50]
   - Calls classifyUnclassifiedJobs()
   - Prints summary to stdout
   - Exits 0 on success

4. ADD TO PROMPTS (update src/lib/llm/prompts.ts):
   - Export: JOB_CLASSIFICATION_SYSTEM_PROMPT
   - Must include ALL bounded categories (copy from criteria.ts)
   - Must request JSON output with exact field names

TESTS (mock OpenAI — no real API calls):

tests/lib/llm/classify-job.test.ts:
- Test: job description with clear qualifications → returns populated ClassifiedCriteria
- Test: LLM returns category not in bounded list → that field set to null
- Test: LLM timeout → retries, then returns null for all fields after 2 failures

tests/lib/llm/batch-classify.test.ts:
- Test: 3 unclassified jobs → all 3 get classified_at set to non-null
- Test: 1 of 3 fails classification → other 2 still classified, result.failed = 1
- Test: 0 unclassified jobs → returns { total: 0, classified: 0, failed: 0 }
(Use test DB with seed data from Sprint 1)

VERIFICATION:
1. `npx tsc --noEmit` exits 0
2. `npx vitest run` exits 0
3. `npx tsx --check scripts/classify-jobs.ts` exits 0
4. JOB_CLASSIFICATION_SYSTEM_PROMPT contains all 15 INDUSTRIES values
   (grep check: grep -c "Hospitality" src/lib/llm/prompts.ts should return ≥ 1)
5. classify-job.ts imports criteria from criteria.ts (not hardcoded)
```

**Estimated stories:** 3-4 (classify function, batch processor, script, tests)
**Risk:** Low — mirrors Sprint 2 LLM pattern. Mocked tests.

---

## SPRINT 6: "Matching Engine + Results"

**One Antfarm run. Goal: SQL matching engine + results API + results page.**

### TASK (verbatim handoff):

```
PROJECT: aimeajob — AI job matching web app
REPO: [path]

OBJECTIVE: Build the matching engine (SQL-based, compares profile criteria
against classified jobs), search API route, and results display page.

DEPENDS ON: All previous sprints (profiles + classified jobs in DB).

EXISTING CODE:
- src/lib/db/schema.ts — profiles, jobs, searches, search_results tables
- src/lib/criteria.ts — SENIORITY_LEVELS, YEARS_EXPERIENCE (for adjacency logic)
- src/lib/validation.ts — Zod schemas

WHAT TO BUILD:

1. MATCHING ENGINE (src/lib/matching/engine.ts):
   - Function: findMatches(profileId: string, options?: { delta?: boolean }): Promise<MatchResult>
   - MatchResult type:
     {
       results: MatchedJob[]
       total: number
       search_id: string
     }
   - MatchedJob type:
     {
       job_id: string
       title: string
       company: string | null
       location: string | null
       url: string
       posted_at: Date | null
       match_score: number  // 0-8
       matched_criteria: string[]   // e.g. ['years_experience', 'industry', ...]
       unmatched_criteria: string[] // criteria that didn't match
       salary_min: number | null
       salary_max: number | null
       salary_currency: string | null
       employment_type: string | null
       is_remote: boolean | null
     }

   MATCHING RULES (implement exactly these):
   For each of the 8 criteria, score 1 if matched, 0 if not:

   a) years_experience: match if EXACT same bucket, OR adjacent bucket.
      Adjacent means ±1 position in ['0-1','2-4','5-9','10-15','15+'].
      Example: profile='5-9' matches job='5-9' (exact) and job='10-15' (adjacent).
      If job.years_experience IS NULL → score 1 (benefit of doubt).

   b) education_level: match if profile level >= job level.
      Order: 'High school' < 'Bachelors' < 'Masters' < 'PhD'.
      Example: profile='Masters' matches job='Bachelors' (overqualified OK).
      If job.education_level IS NULL → score 1.

   c) field_of_study: EXACT match only.
      If job.field_of_study IS NULL → score 1.

   d) sphere_of_expertise: EXACT match only.
      If job.sphere_of_expertise IS NULL → score 1.

   e) seniority_level: match if EXACT or ±1 position in SENIORITY_LEVELS array.
      If job.seniority_level IS NULL → score 1.

   f) languages: match if ALL of job.languages are contained in profile.languages.
      Use array containment: profile.languages @> job.languages.
      If job.languages IS NULL or empty → score 1.

   g) industry: EXACT match only.
      If job.industry IS NULL → score 1.

   h) key_skills: match if array overlap count >= 2.
      Count: how many of profile.key_skills appear in job.key_skills (case-insensitive).
      If overlap >= 2 → score 1. If job.key_skills IS NULL → score 1.

   FILTER: Only return results where total score >= 5.
   ORDER: score DESC, then posted_at DESC NULLS LAST.
   LIMIT: 50 results.

   DELTA MODE: If options.delta = true, add WHERE jobs.ingested_at > profile.last_search_at.

   SIDE EFFECTS:
   - Create a searches record (profile_id, result_count, is_delta)
   - Create search_results records (one per matched job)
   - Update profile.last_search_at = NOW()

2. SEARCH API ROUTE (src/app/api/search/route.ts):
   - POST handler: body { profile_id: string }
   - Calls findMatches(profile_id)
   - Returns: { data: { results: MatchedJob[], total: number, search_id: string },
                meta: { threshold: 5, max_score: 8, searched_at: string } }

3. DELTA SEARCH API (src/app/api/search/delta/route.ts):
   - POST handler: body { profile_id: string }
   - Calls findMatches(profile_id, { delta: true })
   - Returns same format + meta.is_delta: true, meta.since: string

4. RESULTS PAGE (src/app/results/page.tsx):
   - Reads profile_id from URL query params
   - Calls POST /api/search on mount
   - Displays results as cards:
     * Job title (bold)
     * Company name
     * Location
     * Match score badge: colored circle with "7/8" text
       - Green (7-8), Yellow (6), Orange (5)
     * "Why this matched" expandable section:
       - Green checkmarks for matched_criteria
       - Red X for unmatched_criteria
     * Salary range (if available)
     * "View Job →" link opening url in new tab
   - Empty state: "No matches found above 5/8 threshold. Try broadening your profile."
   - "Check for New Jobs" button: calls delta search API, replaces results
   - After delta: shows "X new jobs since [date]" header
   - Loading spinner during search

STYLING:
- Same Tailwind conventions as Sprint 3
- Cards: white bg, rounded-lg, shadow-sm, p-4, mb-3
- Match badge: inline-flex, rounded-full, w-10 h-10, font-bold, centered text
- Max width 640px container

TESTS:

tests/lib/matching/engine.test.ts (use test DB with seed data):
- Test: profile with exact industry match to 3 jobs → those 3 jobs in results
- Test: profile matching 4/8 criteria on a job → that job NOT in results (below threshold)
- Test: profile matching 6/8 → job IS in results
- Test: adjacent seniority (profile=Senior, job=Lead/Manager) → counts as match
- Test: education overqualification (profile=PhD, job=Bachelors) → counts as match
- Test: languages containment (profile=['English','German'], job=['English']) → match
- Test: languages NOT contained (profile=['English'], job=['English','German']) → no match
- Test: key_skills overlap of 1 → no match. Overlap of 2 → match.
- Test: null job criteria → scores as match (benefit of doubt)
- Test: delta mode only returns jobs ingested after last_search_at
- Test: results ordered by score DESC
- Test: max 50 results returned
- Test: search + search_results records created in DB
- Test: profile.last_search_at updated after search

tests/api/search.test.ts:
- Test: POST with valid profile_id → 200 + results array
- Test: POST with non-existent profile_id → 404

VERIFICATION:
1. `npx tsc --noEmit` exits 0
2. `npx vitest run` exits 0 — ALL matching tests pass
3. At least 13 test cases in engine.test.ts (one per rule above)
4. No raw SQL strings containing user input (parameterized only)
   Verify: grep -n "'" src/lib/matching/engine.ts should not show string concatenation with variables
```

**Estimated stories:** 5-6 (matching logic, scoring helpers, search API, delta API, results page, tests)
**Risk:** Medium — matching logic is the core product. 13 test cases provide good coverage.

---

## SPRINT 7: "Landing Page + Email Save + Deploy"

**One Antfarm run. Goal: landing page, email save/restore with token, Vercel deployment.**

### TASK (verbatim handoff):

```
PROJECT: aimeajob — AI job matching web app
REPO: [path]

OBJECTIVE: Build landing page, email-based profile save/restore (with security token),
and prepare for Vercel deployment.

DEPENDS ON: All previous sprints complete.

WHAT TO BUILD:

1. LANDING PAGE (src/app/page.tsx — replace placeholder):
   - Hero section:
     * Heading: "Find jobs that actually match your skills"
     * Subheading: "Upload your CV. We extract your profile. You see only relevant jobs."
     * Blue CTA button: "Upload Your CV →" linking to /upload
   - "How it works" section (3 steps):
     * Step 1: "Upload your CV" — "We extract your experience, skills, and expertise"
     * Step 2: "Confirm your profile" — "Review what we found and add your preferences"
     * Step 3: "See matched jobs" — "Get a ranked shortlist based on 8 matching criteria"
   - Footer: "aimeajob © 2026"
   - Server component (no client JS needed)
   - Tailwind styling, max-w-3xl mx-auto, centered

2. SAVE API (src/app/api/save/route.ts):
   - POST handler: body { profile_id: string, email: string }
   - Validates email format (Zod z.string().email())
   - Generates 12-character alphanumeric restore_token (use crypto.randomBytes)
   - Updates user record: SET email = ?, restore_token = ?
   - Returns: { data: { saved: true, restore_token: "a7x9k2m4p1q8" } }
   - If email already exists on different user → 409 Conflict

3. RESTORE API (src/app/api/restore/route.ts):
   - POST handler: body { email: string, restore_token: string }
   - Looks up user WHERE email = ? AND restore_token = ?
   - If found: returns full profile (criteria + preferences)
   - If not found: returns 404 { errors: [{ code: "NOT_FOUND", message: "No profile found" }] }
   - Same 404 whether email wrong or token wrong (no enumeration)

4. SAVE PROMPT ON RESULTS PAGE (update src/app/results/page.tsx):
   - After results display, show a card:
     "Save your profile for next time"
     Email input + "Save" button
   - On success: show restore_token prominently in a highlighted box:
     "Your restore code: a7x9k2m4p1q8 — save this to access your profile later"
   - On 409: "This email is already registered"

5. RESTORE PAGE (src/app/restore/page.tsx):
   - Simple form: email input + token input + "Restore" button
   - On success: redirect to /results?profile_id=<id>
   - On 404: "Profile not found. Check your email and code."
   - Link from landing page: small "Returning user?" link under CTA

6. VERCEL CONFIG:
   - next.config.js: ensure output is compatible with Vercel
   - vercel.json (if needed): configure rewrites/headers
   - .env.example: document ALL required env vars:
     DATABASE_URL, OPENAI_API_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY, JOOBLE_API_KEY

TESTS:

tests/api/save.test.ts:
- Test: valid email + profile_id → 200 + restore_token is 12 chars alphanumeric
- Test: invalid email format → 400
- Test: duplicate email on different user → 409

tests/api/restore.test.ts:
- Test: correct email + token → 200 + full profile
- Test: correct email + wrong token → 404
- Test: wrong email + correct token → 404
- Test: nonexistent email → 404

VERIFICATION:
1. `npx tsc --noEmit` exits 0
2. `npx vitest run` exits 0
3. Landing page at / returns HTML with "Upload Your CV" text
   (curl http://localhost:3000 | grep -c "Upload Your CV" should be ≥ 1)
4. Landing page has no client-side JS bundle loaded (it's a server component)
   (check: no "use client" directive in src/app/page.tsx)
5. restore_token in save response is exactly 12 characters
   (test assertion covers this)
6. All env vars documented in .env.example (grep check: should contain all 5 vars)
```

**Estimated stories:** 5-6 (landing page, save API, restore API, restore page, results update, tests)
**Risk:** Low — simple CRUD + static page.

---

## Sprint Dependencies

```
Sprint 1 (Foundation) ← No dependencies
    ↓
Sprint 2 (CV Upload) ← Depends on Sprint 1
    ↓                    ↓
Sprint 3 (Profile UI)   Sprint 4 (Job Ingestion) ← Both depend on Sprint 1
    ↓                    ↓
    ↓                    Sprint 5 (Classification) ← Depends on Sprint 2 + 4
    ↓                    ↓
Sprint 6 (Matching) ← Depends on Sprint 3 + 5
    ↓
Sprint 7 (Polish + Deploy) ← Depends on Sprint 6
```

Sprints 3 and 4 can run in parallel. Sprint 5 needs both 2 and 4.

---

## Post-Sprint: Deployment (Manual)

After Sprint 7, deployment is a manual step (not Antfarm):
1. Create Supabase project, get connection string
2. Create Vercel project, link to GitHub repo
3. Set all env vars on Vercel
4. Run `npx drizzle-kit push` against production DB
5. Deploy via `vercel --prod`
6. Set up OpenClaw cron for job ingestion (every 6 hours)
7. Run initial ingestion: `npx tsx scripts/ingest-jobs.ts`
8. Run initial classification: `npx tsx scripts/classify-jobs.ts`
9. Test end-to-end: upload CV → see results
