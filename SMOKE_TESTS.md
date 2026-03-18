# aimeajob Smoke Tests

Quick manual verification checklists. Run after major deploys or migrations.

---

## After running `0003_dual_engine.sql` on Supabase

```
[ ] 1. Supabase → Table Editor → jobs → confirm `cosine_score` column exists
[ ] 2. curl https://aimeajob.vercel.app/api/search?q=data+scientist
        → response JSON should include "score" or "hybrid_score" field > 0
[ ] 3. Open https://aimeajob.vercel.app → search "data scientist" → results should load normally
[ ] 4. Check Supabase → Table Editor → jobs → cosine_score values non-null for recent rows
[ ] 5. Trigger one classification pass:
        POST https://aimeajob.vercel.app/api/pipeline?classify=true
        Header: x-cron-secret: dbcabcf8e68dae2035bfb2535047e52a5f76ece508d2219e7de3c2a7299f0789
        → response: { "classified": N } where N > 0
```

**If any step fails:** Check Supabase logs + Vercel function logs before re-running migration.

---

## After any Vercel deploy

```
[ ] 1. curl https://aimeajob.vercel.app/ → HTTP 200
[ ] 2. curl https://aimeajob.vercel.app/api/search?q=engineer → valid JSON with results array
[ ] 3. POST /api/pipeline?classify=true (see secret above) → HTTP 200, not 500
```

---

## After Adzuna ingestion fix

```
[ ] 1. POST /api/pipeline (no params) → HTTP 200 within 300s
[ ] 2. Response includes { ingested: [{ source: "adzuna", fetched: N, new: M }] }
[ ] 3. Check Supabase: job count increased
```

---

*Last updated: 2026-03-18*
