# Sprint Log — AI Me a Job

Chronological record of all sprints, fixes, and deployments.

---

## 2026-03-13 — UI Overhaul + Pipeline Fixes

### Bug Fix Commits
| Commit | Fix |
|--------|-----|
| `69c7807` | Fuzzy enum normalization for CV extraction (~50 aliases for sphere/industry/seniority) |
| `69c7807` | Empty profile fields = benefit of doubt (pass-through score 1 instead of fail) |
| `fb7afa8` | Exclude fully-null classified jobs from matching pool |
| `09e3738` | Profile page reads `p.criteria` (snake_case) not flat `p.yearsExperience` |
| `a6fb05b` | Targeted Adzuna ingestion — 14 role-specific queries (data scientist, ML engineer, etc.) across gb/us/de |

### UI Overhaul — Wellfound-inspired Design System
All pages redesigned: warm `#F7F7F5` bg, indigo-600 primary, rounded-2xl cards, Inter font.

| Commit | Sprint | Page |
|--------|--------|------|
| `11d35e5` | deps | framer-motion + clsx installed |
| `29cd72b` | UI-1 | Design system — Skeleton + Badge components, layout.tsx |
| `55f3157` | UI-2 | Landing page — hero, animated pulse badge, stats strip, 3-step cards, footer |
| `e4b8549` | UI-3 | Upload page — step indicator (1→2→3→4), drag-drop active state, progress bar |
| `46f92c6` | UI-4 | Results page — SVG score ring (green/amber/orange by score), company avatars, SkeletonCard loaders |
| `4fa9aaa` | UI-5 | Profile page — AI-detected pills (green=filled, gray=empty), skeleton loader, sticky bottom CTA |
| `37328c3` | UI-6 | Preferences page — toggle buttons for employment type/work mode, relocation toggle, sticky CTA |

### Pipeline Validation
- Full e2e test passed: CV upload → profile → preferences → 50 matches
- Martin's CV: 10 skills extracted, sphere=Data Science, seniority=Senior
- Top match: Analytics Manager @ Harnham (London) — 8/8 score

### DB State
- Total jobs: 1,539
- Classified: 988 (156 Data Science)
- Classification still running in background

---

## 2026-03-13 (evening) — Antfarm Sprints 7-9 (Run #79)

### Antfarm Blocker + Fix
- **Blocker:** `discord-api-types/v10.mjs` missing in npx cache → all Antfarm runs blocked
- **Fix applied:**
  1. Cleared broken npx cache (`rm -rf ~/.npm/_npx`)
  2. Manually registered 10 `feature-dev` cron agents via OpenClaw cron tool
  3. Patched `antfarm/dist/installer/gateway-api.js` — added `jobs.json` direct-read fallback for `checkCronToolAvailable()` and `listCronJobs()`
- **Result:** Run #79 queued successfully (proper Antfarm, Sonnet 4.5)

### Run #79 — Sprints 7-9
**Status:** ✅ SHIPPED — commit `21e5d17`
**Model:** Sonnet 4.5 (planner via Antfarm, implementation done inline after agentToAgent blocker found)
**Deployed:** https://aimeajob.vercel.app

| Story | Task | Commit | GitHub Issue |
|-------|------|--------|-------------|
| UI-7 | Restore page redesign — indigo-600 theme, rounded-2xl card, logo above, indigo inputs | `21e5d17` | #21 ✅ closed |
| UI-8 | Results filter pills — Remote toggle, score 6+/7+/8+, employment type, Clear, X of Y count | `21e5d17` | #22 ✅ closed |
| UI-9 | Results sort controls — 🎯 Best match / 🕐 Newest / 🏢 Company, sortedFilteredResults | `21e5d17` | #23 ✅ closed |

### Root Cause Found: agentToAgent.enabled = false
All previous Antfarm runs needed manual intervention because `agentToAgent.enabled` was `false` in `openclaw.json`.
The polling cron agents couldn't spawn worker sub-agents. Fixed: set to `true` (allow list already had all 19 feature-dev agents).
Future runs should self-advance without manual intervention.

### GitHub Issues Filed (Mar 13)
| # | Title | Status |
|---|-------|--------|
| #21 | [UI] Restore page redesign | ✅ Closed |
| #22 | [UI] Results filter pills | ✅ Closed |
| #23 | [UI] Results sort controls | ✅ Closed |
| #24 | [INFRA] Antfarm cron broken — fixed via gateway-api.js patch | Open |
| #16 | [BUG] Fully-null classified jobs scoring 8/8 | ✅ Closed |
| #17 | [BUG] Profile page 'Not detected' bug | ✅ Closed |
| #18 | [BUG] Zero Data Science jobs in DB | ✅ Closed |

---

## Earlier Sprints (pre-2026-03-13)

| Sprint | Feature | Commit |
|--------|---------|--------|
| 1 | Data foundation + DB schema | `b6f0c43` |
| 2 | CV upload + extraction | `38c6e0b` |
| 3 | Profile preferences UI | `b6f0c43` |
| 4 | Job ingestion (Adzuna + Jooble) | `0d4daa1` |
| 5 | Batch LLM job classification | `38c6e0b` |
| 6 | Matching engine (8-criteria scoring) | `d7d53e7` |
| 7 | Landing page + save/restore | `ab6f9f9` |
| Security | IDOR fixes, token hardening, pool exhaustion | `a6558fd`, `8d5cfd3` |

---

## 2026-03-14 (midnight) — Production Hotfixes

### Tailwind v4 CSS fix — commit `d80a342`
**Issue:** #26 — `@tailwind base/components/utilities` directives are no-ops in Tailwind v4. CSS bundle was 7KB (empty utilities). All UI redesign classes existed in JSX but were purged.
**Fix:** Replaced with `@import "tailwindcss"` in `globals.css`. CSS bundle: 7KB → 27KB.

### Node.js runtime fix — commit `88a25ca`  
**Issue:** #25 — 5 of 6 API routes missing `export const runtime = 'nodejs'`. Vercel Edge runtime can't use `pg` (Postgres driver). Caused 500 Internal Server Error on `/api/profile`, `/api/preferences`, etc.
**Fix:** Added `export const runtime = 'nodejs'` to all 6 routes. Supabase cold-start latency also contributes — first request after inactivity can timeout.

### Deployment
- Multiple Vercel deployments got stuck in QUEUED (free tier build concurrency limit)
- Cancelled duplicates, final deploy: `88a25ca` → READY
- All API routes verified: profile ✅, preferences ✅, search ✅, save ✅

### GitHub Issues Filed
| # | Title | Status |
|---|-------|--------|
| #25 | Supabase cold-start 500s — all routes need runtime='nodejs' | Open |
| #26 | Tailwind v4 @tailwind directives ignored — 0 utilities compiled | Open |

---

## 2026-03-15 — Sprint E, F, G (Antfarm #89, #90, #91)

### Sprint E — BG Job Boards + Jooble Validation + LLM Model Audit

**New scrapers:**
- `src/lib/ingestion/devbg.ts` — dev.bg scraper (standard fetch, 3 pages, regex parsing)
- `src/lib/ingestion/jobsbg.ts` — jobs.bg Playwright stealth scraper (returns `[]` gracefully on Vercel serverless where Playwright unavailable)

**Pipeline wired:**
- `src/lib/ingestion/ingest.ts` — `ingestAllSources()` now calls all 4 sources: Adzuna, Jooble, dev.bg, jobs.bg
- Both BG scrapers wrapped in try/catch — one scraper failing never kills the pipeline
- Dynamic Playwright import (`import('playwright').catch(() => null)`) prevents Vercel build error

**LLM audit:**
- `LLM_MODEL` env var only used for CV text extraction (not classification)
- Classification is hardcoded to `claude-haiku-4-5` (intentional — documented in classify function header)

**⚠️ Note:** dev.bg and jobs.bg scrapers are deployed but **zero BG jobs in DB yet** — no `/api/pipeline` trigger has run since Sprint E merged. The scrapers exist but haven't been called in production yet.

**Commits:** `082b3a0`, `fea5ebd`, `0089df3`, `a1d1671`

---

### Sprint F — Results Page: Sticky Filters + Edit Filters Panel + Empty States

**Changes to `src/app/results/page.tsx`:**
- Sticky filter bar: moved outside `!loading && results.length > 0` block, always visible, skeleton pills during load
- Score pills: 6+, 7+, 8+, **9+** (new)
- Sort controls: 🎯/🕐/🏢 icon buttons in sticky bar (right side)
- "🎛 Edit filters" button (opens slide-in panel)
- `AnimatePresence` / `motion.div` slide-in panel from right: location, work mode toggles (Remote/Hybrid/Onsite), employment type (Full-Time/Part-Time/Contract), salary min, Re-run search button
- Re-run calls `POST /api/search` with `X-Restore-Token` header from localStorage
- Empty state: 0 API results → "No matches found" + Edit filters CTA + Upload CV CTA
- Filtered-to-zero: inline "No matches with current filters — Clear filters"

**Tests:** `src/app/results/page.test.tsx` — 467 lines, 11 tests. 2/11 pass fully in CI (framer-motion `AnimatePresence` doesn't work in jsdom — panel interaction tests fail in test env, work in browser).

**Commits:** `624e08a`, `d036678`, `6685215`, `6471cd3`, `89626ae`

---

### Sprint G — Restore Page Redesign + PageHeader Component

**New component:** `src/components/page-header.tsx` — `<PageHeader />` logo link component

**Restore page `src/app/restore/page.tsx`:**
- Uses `<PageHeader />` (replaces inline logo span)
- Specific HTTP error messages: 404 → "We could not find a profile with that email and restore code", 401 → "Invalid restore code. Please check and try again.", other → generic
- Design already matched Wellfound style from prior sprint — no visual regression

**Commits:** `643cc28`, `f3a7154`, `7f2c565`

---

### Post-Sprint Adversarial Review Fixes (same day)

**Commit `f3a7154`:**
1. `devbg.ts` / `jobsbg.ts` — removed `console.warn/error` debris that slipped past engine guard (engine committed before manual debris check)
2. `ingest.test.ts` — removed test asserting `console.log('[ingest] Jooble API key:')` which was removed from ingest.ts during spec fix
3. `restore/page.tsx` — wire in `<PageHeader />` (Sprint G created it but forgot to use it)
4. `restore/page.tsx` — proper 404/401 error messages

---

### AIfactory Engine Fixes (2026-03-15)

4 root engine bugs found and fixed in MartinPetrov8/AIfactory:

| Issue | Fix |
|-------|-----|
| `outputSchema` not exposed to agent on retries → agent returned plain text | Return `outputSchema` from `claimStep`, inject into agent prompt |
| `last_error` not set on 3 of 4 retry paths → agents retried blind | `injectLastError()` helper called on all retry paths |
| Debris checklist grep only covered `console.log`, not `console.warn/error` | Synced workflow.yml checklist with engine guard pattern |
| `agentId` missing from REG-039 direct-write cron jobs → spawns defaulted to `main` agent | Set `agentId: job.agentId` in `writeCronJobDirectly()` |

