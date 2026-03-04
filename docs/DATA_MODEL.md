# Data Model — aimeajob

## Overview

Three core entity groups:
1. **Users & Profiles** — CV-extracted criteria + preferences
2. **Jobs** — Ingested postings with classified criteria
3. **Matches** — Search results linking profiles to jobs

---

## Entity: `users`

Lightweight — anonymous by default, optional email.

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email | TEXT | NULLABLE, UNIQUE (optional save) |
| restore_token | TEXT | NULLABLE (random 12-char token, shown once at save time) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

---

## Entity: `profiles`

One per user. Stores the confirmed 8 criteria + preferences.

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | NOT NULL, FK → users(id) ON DELETE CASCADE, UNIQUE |
| cv_filename | TEXT | NOT NULL |
| cv_raw_text | TEXT | NULLABLE (stored for re-extraction if needed) |
| years_experience | TEXT | NOT NULL, CHECK IN ('0-1','2-4','5-9','10-15','15+') |
| education_level | TEXT | NOT NULL, CHECK IN ('High school','Bachelor\'s','Master\'s','PhD') |
| field_of_study | TEXT | NOT NULL, CHECK IN (12 bounded values) |
| sphere_of_expertise | TEXT | NOT NULL, CHECK IN (15 bounded values) |
| seniority_level | TEXT | NOT NULL, CHECK IN ('Entry','Junior','Mid','Senior','Lead/Manager','Director+') |
| languages | TEXT[] | NOT NULL (array of language strings) |
| industry | TEXT | NOT NULL, CHECK IN (15 bounded values) |
| key_skills | TEXT[] | NOT NULL (array, 5-8 items) |
| pref_employment_type | TEXT[] | NULLABLE (subset of: Full-time, Part-time, Contract, Freelance) |
| pref_location | TEXT | NULLABLE (free text: country/city or "Anywhere") |
| pref_work_mode | TEXT | NULLABLE, CHECK IN ('Remote','Hybrid','On-site','Any') |
| pref_relocation | BOOLEAN | NULLABLE |
| pref_salary_min | INTEGER | NULLABLE |
| pref_salary_max | INTEGER | NULLABLE |
| pref_salary_currency | TEXT | NULLABLE |
| last_search_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**Bounded values for `field_of_study`:**
STEM, Business & Economics, Law, Medicine & Health, Social Sciences, Humanities, Arts & Design, Education, Agriculture & Environment, Communications & Media, Trades & Technical, Other

**Bounded values for `sphere_of_expertise`:**
Data Science, Sales, HR, Engineering, Marketing, Finance, Operations, Product, Design, Legal, Healthcare, Education, IT/DevOps, Consulting, Other

**Bounded values for `industry`:**
Technology, Finance & Banking, Healthcare, Manufacturing, Retail & E-commerce, Consulting, Telecom, Energy, Real Estate, Government, Education, Media & Entertainment, Logistics & Transport, Hospitality, Other

---

## Entity: `jobs`

Pre-classified job postings. LLM classifies at ingestion time.

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| external_id | TEXT | NOT NULL |
| source | TEXT | NOT NULL, CHECK IN ('adzuna','jooble','eures') |
| title | TEXT | NOT NULL |
| company | TEXT | NULLABLE |
| location | TEXT | NULLABLE |
| country | TEXT | NULLABLE |
| url | TEXT | NOT NULL |
| description_raw | TEXT | NOT NULL |
| salary_min | INTEGER | NULLABLE |
| salary_max | INTEGER | NULLABLE |
| salary_currency | TEXT | NULLABLE |
| employment_type | TEXT | NULLABLE |
| is_remote | BOOLEAN | NULLABLE |
| posted_at | TIMESTAMPTZ | NULLABLE |
| expires_at | TIMESTAMPTZ | NULLABLE |
| years_experience | TEXT | NULLABLE, CHECK IN ('0-1','2-4','5-9','10-15','15+') |
| education_level | TEXT | NULLABLE, CHECK IN ('High school','Bachelor\'s','Master\'s','PhD') |
| field_of_study | TEXT | NULLABLE, CHECK IN (12 bounded values) |
| sphere_of_expertise | TEXT | NULLABLE, CHECK IN (15 bounded values) |
| seniority_level | TEXT | NULLABLE, CHECK IN ('Entry','Junior','Mid','Senior','Lead/Manager','Director+') |
| languages | TEXT[] | NULLABLE |
| industry | TEXT | NULLABLE, CHECK IN (15 bounded values) |
| key_skills | TEXT[] | NULLABLE |
| classified_at | TIMESTAMPTZ | NULLABLE (when LLM classified this) |
| ingested_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |

**UNIQUE constraint:** `(source, external_id)` — prevents duplicate ingestion.

**Indexes:**
- `idx_jobs_source_external` ON (source, external_id)
- `idx_jobs_industry` ON (industry)
- `idx_jobs_seniority` ON (seniority_level)
- `idx_jobs_sphere` ON (sphere_of_expertise)
- `idx_jobs_posted` ON (posted_at)
- `idx_jobs_country` ON (country)
- `idx_jobs_skills` ON key_skills USING GIN — required for array overlap (`&&`) in matching
- `idx_jobs_languages` ON languages USING GIN — required for array containment (`@>`) in matching

---

## Entity: `searches`

Tracks each search a user performs. Used for 24h delta.

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| profile_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE |
| searched_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() |
| result_count | INTEGER | NOT NULL |
| is_delta | BOOLEAN | NOT NULL, DEFAULT false |

---

## Entity: `search_results`

Links searches to matched jobs, with match metadata.

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PRIMARY KEY |
| search_id | UUID | NOT NULL, FK → searches(id) ON DELETE CASCADE |
| job_id | UUID | NOT NULL, FK → jobs(id) ON DELETE CASCADE |
| match_score | INTEGER | NOT NULL, CHECK (match_score BETWEEN 0 AND 8) |
| matched_criteria | TEXT[] | NOT NULL (which of the 8 matched) |
| rank | INTEGER | NOT NULL |

**UNIQUE constraint:** `(search_id, job_id)`

---

## Relationships

```
users 1:1 profiles
profiles 1:N searches
searches 1:N search_results
search_results N:1 jobs
```

---

## Migration Strategy

Use Drizzle ORM (Next.js ecosystem) for schema management and migrations. SQL-first schema definition, TypeScript types auto-generated.
