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
