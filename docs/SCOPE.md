# Scope & Project Type

## Project Classification

```
PROJECT_TYPE:
- [x] HAS_DATABASE    → Postgres via Supabase (Drizzle ORM)
- [ ] HAS_SCRAPER     → Not needed (using APIs, not scraping)
- [x] HAS_API         → Next.js API Routes (7 endpoints)
- [x] HAS_FRONTEND    → Next.js App Router, Tailwind, mobile-first
- [x] DATA_PIPELINE   → Job ingestion cron: APIs → LLM classify → Postgres
- [ ] SIMPLE_SCRIPT   → No
```

## MVP Scope Summary

### In Scope
1. **CV Upload & Extraction** — PDF/DOCX → 8 structured criteria via LLM
2. **Profile Confirmation UI** — User reviews, edits, confirms extracted data
3. **Preference Questions** — 3-5 post-CV questions (location, remote, type, relocation, salary)
4. **Job Data Integration** — Adzuna + Jooble + EURES free APIs
5. **Matching Engine** — Dimension-by-dimension matching (8 criteria + preferences)
6. **Results Display** — Ranked shortlist with links to original postings
7. **24h Refresh** — Delta search for returning users
8. **Email Save** — Optional, post-results, no auth
9. **Landing Page** — Clear CTA, zero-friction start
10. **Mobile-First** — Responsive, optimized for phone usage

### Out of Scope
- CV optimization/rewriting
- Auto-apply
- Full user accounts/auth
- Advanced filters
- LinkedIn integration
- Native mobile app
- Employer features
- Payment/subscription
- Bulgarian job boards (jobs.bg, zaplata.bg)
- Company culture matching
- Salary benchmarking

### Geography
EU + UK + US (covered by Adzuna + Jooble + EURES)

### Target Timeline
2-3 weeks for functional MVP

### Team
- **Nikolay Georgiev** — Product Owner, domain expert
- **Martin Petrov** — Technical lead, infrastructure
- **Cookie** — PM, architecture, orchestration
- **Antfarm** — Code execution (sub-agents)
