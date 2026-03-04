# ADR-002: Database — Postgres via Supabase

## Decision
PostgreSQL hosted on Supabase, accessed via Drizzle ORM.

## Context
Need relational storage for users, profiles, jobs, and search results. Multiple concurrent users (serverless functions). Needs arrays (languages, skills).

## Options Considered
1. **Supabase Postgres** — Managed, free tier (500MB, 50K MAU), connection pooling built-in
2. **Vercel Postgres** — Tightly integrated but limited free tier (256MB)
3. **PlanetScale (MySQL)** — No native arrays, no foreign keys in free tier
4. **SQLite (Turso)** — Great for single-writer, but job ingestion + user queries = multi-writer

## Chosen: Supabase Postgres

**Why:**
- Native array types for languages[] and key_skills[] (critical for matching)
- Foreign keys with ON DELETE CASCADE
- Connection pooling via PgBouncer (required for serverless)
- Free tier generous enough for MVP and early growth
- Drizzle ORM has excellent Supabase/Postgres support
- Row-level security available if we add auth later

## Consequences
- External dependency (Supabase)
- Need to use pooled connection string from serverless (not direct)
- If we outgrow free tier, Supabase Pro is $25/mo (fine)
