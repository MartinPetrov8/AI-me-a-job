# aimeajob — Ranking Algorithm

## Overview

The matching engine scores each job against the user's profile on **8 binary criteria**.
Each criterion contributes 1 point. Maximum score = 8. Minimum to appear in results = 5.

Jobs are ranked: score DESC → posted_at DESC (newer breaks ties).

---

## Pre-Filters (applied before scoring)

These filters EXCLUDE jobs from consideration entirely. They do not affect the score.

| Filter | Logic | Source |
|--------|-------|--------|
| `prefWorkMode` | Remote=only remote, On-site=exclude remote, Hybrid/Any=no filter | profile |
| `prefEmploymentType` | Only jobs matching any of the selected types | profile |
| `prefLocation` | City/country string match (see ⚠️ below) | profile |
| `prefSalaryMin` | Only jobs where salary_max ≥ prefSalaryMin | profile |
| `salaryMin` / `salaryMax` | API-level salary range filters | request body |
| `postedWithin` | Jobs posted within N days (7 or 30) | request body |
| `isClassified` | Jobs with no classified fields AND no title are excluded | engine |

### ⚠️ Known Issue: Location is a pre-filter, NOT a scored criterion (Issue #37)

Location match contributes **0 points** to the score. A US job scoring 7/8 will rank above a
London job scoring 5/8 even when the user prefers London, because:
1. Both pass the location pre-filter (or the US job is marked `is_remote=true` which unconditionally passes)
2. Ranking is purely by score, not by location relevance

**Fix planned (Issue #37):** Add location as a scored criterion or weighted tie-breaker.

---

## Scoring Criteria (8 points total)

### 1. `years_experience` (1 pt)
**Pass condition:** profile experience is within 1 band of job requirement  
**Edge cases:**
- Job has null → auto-pass (benefit of doubt)
- Profile has no value → auto-pass
- Bands: `0-1yr, 1-2yr, 2-3yr, 3-5yr, 5-7yr, 7-10yr, 10+yr` (defined in `criteria.ts`)

### 2. `education_level` (1 pt)
**Pass condition:** profile education ≥ job requirement  
**Edge cases:**
- Job has null → auto-pass
- Profile has no value → auto-pass
- Levels (ascending): `High School, Associate, Bachelor, Master, PhD`

### 3. `field_of_study` (1 pt)
**Pass condition:** exact string match OR job has null OR profile has no value  
**⚠️ Weakness:** No fuzzy match — "Computer Science" ≠ "Computing" ≠ "Software Engineering"

### 4. `sphere_of_expertise` (1 pt)
**Pass condition:** exact string match OR job has null OR profile has no sphere  
**⚠️ Weakness:** Same as field_of_study — exact match only

### 5. `seniority_level` (1 pt)
**Pass condition:** within 1 band of profile seniority  
**Bands:** `Intern, Junior, Mid, Senior, Lead, Principal, Director, VP, C-Level`

### 6. `languages` (1 pt)
**Pass condition:** ALL job-required languages appear in profile languages  
**Edge cases:**
- Job has null or empty → auto-pass
- Profile has no languages → auto-pass

### 7. `industry` (1 pt)
**Pass condition:** exact string match OR job has null OR profile has no industry  
**⚠️ Weakness:** Same exact-match limitation

### 8. `key_skills` (1 pt)
**Pass condition:** ≥2 job skills overlap with profile skills (case-insensitive)  
**Edge cases:**
- Job has null or empty → auto-pass
- Profile has no skills → auto-pass

---

## Scoring Summary Table

| # | Criterion | Match type | Null job = | Null profile = |
|---|-----------|-----------|------------|----------------|
| 1 | years_experience | ±1 band | pass | pass |
| 2 | education_level | ≥ level | pass | pass |
| 3 | field_of_study | exact | pass | pass |
| 4 | sphere_of_expertise | exact | pass | pass |
| 5 | seniority_level | ±1 band | pass | pass |
| 6 | languages | all required | pass | pass |
| 7 | industry | exact | pass | pass |
| 8 | key_skills | ≥2 overlap | pass | pass |

**Pattern:** Null job value = always pass (benefit of doubt). This means unclassified jobs
can score 8/8 purely by having all nulls. This inflates scores for jobs with poor
classification coverage.

---

## Known Algorithmic Weaknesses

| Issue | Impact | Fix |
|-------|--------|-----|
| Location is pre-filter only, not scored | US jobs rank same as London when user wants London | Add as criterion #9, or weighted tie-breaker |
| Null inflation | Unclassified jobs score high by having all nulls | Penalize null-heavy jobs; require ≥3 non-null criteria |
| Exact string matching | "Data Science" ≠ "Data Analytics" | Fuzzy match / embedding similarity |
| No recency weight | A 6/8 job from yesterday ties with 6/8 from 3 months ago | Recency multiplier in sort |
| All 8 criteria weighted equally | key_skills match ≠ education match in importance | Weighted scoring |
| Score threshold hardcoded at 5 | May exclude good matches if classification is sparse | Make threshold dynamic based on corpus quality |

---

## Sort Options

After scoring, results can be re-sorted:

| Sort | Logic |
|------|-------|
| `score` (default) | score DESC → posted_at DESC (ties broken by recency) |
| `posted_at` | posted_at DESC NULLS LAST |
| `salary_max` | salary_max DESC NULLS LAST |

Client-side filters (applied on top of server sort):
- Remote only
- Minimum score (6+, 7+, 8+, 9+ — note 9 is impossible with max=8, UI bug)
- Employment type
