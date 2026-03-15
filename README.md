# aimeajob — AI-Powered Job Matcher

Upload your CV → get matched to jobs scored 1-10 against your profile. Restore your session anytime with email + code.

**Live:** https://aimeajob.vercel.app

## What It Does
1. Upload CV → AI extracts your profile (experience, skills, seniority, location)
2. Set preferences (work mode, employment type, salary)
3. Get a ranked list of job matches scored against 8 criteria
4. Save your profile — restore anytime with email + restore code
5. Filter results by score, remote, employment type — or re-run with different preferences

## Stack
- **Frontend:** Next.js 15 App Router, TypeScript strict, Tailwind CSS, framer-motion
- **Backend:** Vercel serverless (Node.js runtime), Drizzle ORM
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude Haiku 4.5 for CV extraction + job classification
- **Job Sources:** Adzuna (7 countries), Jooble, dev.bg, jobs.bg

## Job Sources
| Source | Coverage | Method |
|--------|----------|--------|
| Adzuna | UK, DE, US, AU, NL, CA, FR | REST API |
| Jooble | Eastern Europe | REST API |
| dev.bg | Bulgaria | Fetch + HTML parse |
| jobs.bg | Bulgaria | Playwright stealth (local only — serverless returns []) |

## Database
- **1,539 jobs** currently (Adzuna only — BG scrapers added but pipeline not triggered yet)
- Schema: `id, external_id, source, title, company, location, country, url, description_raw, salary_min/max/currency, employment_type, is_remote, posted_at, years_experience, seniority_level, sphere_of_expertise, industry, languages, key_skills, classified_at, canonical_url, content_hash`

## Development
```bash
npm install
cp .env.example .env.local  # fill DATABASE_URL, ANTHROPIC_API_KEY, ADZUNA_APP_ID/KEY, JOOBLE_API_KEY
npm run dev                  # localhost:3000
npx tsc --noEmit             # type check
npx vitest run               # tests (136 total, 126 pass — 10 known failures in api/preferences + framer-motion jsdom)
```

## Deployment
```bash
npx vercel --prod --yes --token <VERCEL_TOKEN>
```

## Docs
- `docs/ARCHITECTURE.md` — system design
- `docs/API.md` — all API routes
- `docs/DATA_MODEL.md` — DB schema
- `docs/SPRINT-LOG.md` — full sprint history
- `docs/RISKS.md` — known issues + mitigations
