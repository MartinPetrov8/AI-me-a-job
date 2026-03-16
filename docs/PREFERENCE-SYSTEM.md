# aimeajob — Preference System

## Overview

Users can set preferences that affect which jobs are returned and how they're ranked.
Preferences are stored on the `profiles` table and set via the `/preferences` page or
the Edit Filters slide-in panel on the Results page.

---

## Preference Fields

| Field | Type | Set via | Engine role |
|-------|------|---------|-------------|
| `prefLocation` | string (city/country) | Preferences page | **Pre-filter** only (⚠️ not scored) |
| `prefWorkMode` | `Remote` / `On-site` / `Hybrid` / `Any` | Preferences page | **Pre-filter** |
| `prefEmploymentType` | string[] | Preferences page | **Pre-filter** |
| `prefSalaryMin` | number | Preferences page | **Pre-filter** (when job has salary data) |

---

## How Each Preference Works

### prefLocation
```
Engine behaviour: PRE-FILTER (binary pass/fail, contributes 0 to score)

matchLocation(prefLocation, jobLocation, isRemote):
  if no prefLocation → pass
  if is_remote=true → ALWAYS PASS (unconditional)
  if jobLocation=null → pass (benefit of doubt)
  else: loc.includes(pref) || pref.includes(loc.split(',')[0])
```

**⚠️ Known issue (GitHub #37):** Location match is binary and not included in the ranking score.
A job in New York scoring 7/8 will rank above a London job scoring 5/8 when user prefers London,
because once both pass the pre-filter, score determines order — and location is not part of the score.

Additionally, `isRemote=true` jobs always pass regardless of location preference, which inflates
remote job rankings when user wants a specific location.

### prefWorkMode
```
Remote   → only show jobs where is_remote=true
On-site  → only show jobs where is_remote=false (or null)
Hybrid   → no filter
Any      → no filter
```

### prefEmploymentType
```
e.g. ['Full-time', 'Contract']
Jobs are included only if employment_type matches any of the selected values.
If no types selected → no filter (all employment types shown).
```

### prefSalaryMin
```
Filter: job.salary_max >= prefSalaryMin
Only applied when the job HAS salary data (salary_max is non-null).
Jobs with no salary data always pass.
```

---

## API-Level Filters (Edit Filters panel)

These are passed in the POST body to `/api/search` and supplement the profile preferences:

| Param | Type | Logic |
|-------|------|-------|
| `salary_min` | number | job.salary_max >= salary_min (when job has data) |
| `salary_max` | number | job.salary_min <= salary_max (when job has data) |
| `posted_within` | 7 or 30 | job.posted_at >= now - N days |

---

## Client-Side Filters (Results page — do NOT re-call API)

These are applied in the browser after results arrive, using the local result set only:

| Filter | Behaviour |
|--------|-----------|
| 🌍 Remote only | Show only is_remote=true |
| 6+ / 7+ / 8+ / 9+ score | Show only results at or above that score |
| Employment type (from result set) | Filter by employment_type value |
| Sort (Score / Date / Salary) | Re-sort the local result set |

**⚠️ Note:** The 9+ score filter button exists but is impossible to trigger (max score = 8). UI bug.

---

## Preference Interaction Diagram

```
User Profile Preferences
│
├── prefWorkMode ──────────────────────────────────────┐
├── prefEmploymentType ────────────────────────────────┤ Pre-filters
├── prefLocation (⚠️ filter only, not scored) ─────────┤ (applied in engine,
├── prefSalaryMin ─────────────────────────────────────┘  before scoring)
│
│                           ↓
│                     [Job candidates]
│                           │
├── API body salary_min ────┐ Additional filters
├── API body salary_max ────┤ (applied after pre-filters,
└── API body posted_within ─┘  before scoring)
                            │
                            ↓
                    [Score all 8 criteria]
                            │
                            ↓
                    [Rank by score, then recency]
                            │
                            ↓
                    [Top 50 returned to UI]
                            │
                            ↓ (client-side only)
               [Remote / Score / Employment type / Sort filters]
```

---

## Preference Gaps (Known Issues)

| Gap | Impact |
|-----|--------|
| Location is filter-only, not scored (Issue #37) | Location-irrelevant jobs rank high |
| No preference for seniority level | Junior jobs rank equally with senior |
| No preference for industry | Finance jobs rank equally with tech when user is in tech |
| prefSalaryMin only checks salary_max | Could miss jobs where salary_max > prefSalaryMin but salary_min is too low |
| No way to exclude specific locations | Can't say "London only, no remote" |
| 9+ score filter button is impossible to hit | UI confusion (max = 8) |
