# ADR-005: Job Data Sources — Adzuna + Jooble + EURES

## Decision
Use three free job APIs for MVP. Ingest everything available (no freshness filter at ingestion).

## Context
Need job postings covering EU + UK + US. Budget: $0 for data. Nikolay decided to ingest everything available — doubles as a data quality validation exercise.

## Sources

### Adzuna
- **Coverage:** UK, US, DE, FR, NL, AU, and more
- **Free tier:** 250 calls/day (enough for full ingestion with pagination)
- **API quality:** Clean, well-documented, reliable JSON
- **Signup:** https://developer.adzuna.com/

### Jooble
- **Coverage:** 65+ countries including all EU
- **Free tier:** 500 calls/day
- **API quality:** Simple but less structured than Adzuna
- **Signup:** https://jooble.org/api/about

### EURES
- **Coverage:** All EU/EEA countries
- **Free tier:** Unlimited (EU public service)
- **API quality:** SOAP/XML heavy but has REST endpoints
- **Signup:** https://ec.europa.eu/eures/

## Ingestion Strategy
- Cron every 6 hours
- Fetch all available postings (no date filter at API level — per Nikolay's decision)
- Deduplicate by (source, external_id) — upsert, not insert
- LLM-classify new postings only
- Track total ingested per source for data quality monitoring

## Consequences
- DB will grow faster (all postings, not just recent) — monitor storage on Supabase free tier (500MB)
- Stale postings will exist — can add expiry cleanup later
- Three different API formats to normalize — handled per-source in ingestion module
- Adzuna requires app_id + app_key. Jooble requires API key. EURES is open.
