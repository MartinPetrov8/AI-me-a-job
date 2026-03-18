# AI-me-a-job — Lessons Learned

## L-001: Never run crons that call external APIs without rate limiting and quota awareness

**Date:** 2026-03-18
**Severity:** HIGH — burned through entire Adzuna daily API quota (251/250 calls)
**Root cause:** `aimeajob-classify-backlog` cron was set to run every 6 minutes (`everyMs: 360000`). Each call hits the Vercel `/api/pipeline?classify=true` endpoint, which internally fetches job details from the Adzuna API. That's 240 calls/day — exceeding the 250/day free tier limit before the daily ingestion cron even fires.

**Why this happened:**
1. The cron was created during Sprint D to process the unclassified backlog (551/1539 jobs)
2. The 6-minute interval was chosen to "chip away" at the backlog gradually
3. No one checked whether the classify endpoint calls external APIs or just uses local data
4. There's no rate limiting, quota tracking, or circuit breaker in the pipeline endpoint
5. The cron runs 24/7 even after the backlog is cleared — it doesn't check if there's work to do

**What should have existed:**
- **Quota-aware scheduling:** Check remaining API quota before making calls. If quota < 20%, skip.
- **Backlog-aware scheduling:** Don't run if there are 0 unclassified jobs. Check first, call second.
- **Circuit breaker:** If API returns 429 (rate limited), disable the cron and alert. Don't retry blindly.
- **Daily budget:** Reserve 200 calls for ingestion, 50 for classification. Never exceed the budget.
- **Cron description:** Every cron that calls an external API must document: which API, expected calls/day, quota limit.

**Rules (permanent):**
1. **No cron may call an external API on a schedule shorter than 1 hour** without explicit quota math documented in the cron description
2. **Every API-calling cron must have a pre-flight check:** is there work to do? If not, return immediately without calling the API.
3. **Every API-calling cron must respect rate limits:** check response headers for `X-RateLimit-Remaining`. If below threshold, skip and log.
4. **Cron creation requires API budget documentation:** "This cron calls X API, Y times per run, runs Z times/day = Y*Z calls/day. Quota: N/day. Budget utilization: Y*Z/N = P%."

**Fix applied:** All 3 aimeajob crons disabled. classify-backlog needs redesign before re-enabling:
- Change to daily schedule (not every 6 min)
- Add pre-flight: count unclassified jobs, if 0 → skip
- Add quota check: if Adzuna remaining < 50 → skip
- Classification should use local LLM (Qwen/Ollama), NOT Adzuna API calls
