# AI-me-a-job — Lessons Learned

## L-001: Never run crons that call external APIs without rate limiting and quota awareness

**Date:** 2026-03-18
**Severity:** HIGH — burned through entire Adzuna daily API quota (251/250 calls)
**Root cause:** Two compounding issues:
1. `aimeajob-adzuna-daily` ingestion cron calls `fetchAllAdzunaJobs()` which iterates 7 countries × 14 queries = **98 API calls per run**. Running once daily = 98/250 quota. But any manual testing, debugging, or accidental double-trigger pushes this over 250.
2. `aimeajob-classify-backlog` cron ran every 6 min, calling the pipeline endpoint. While classification itself uses OpenRouter LLM (not Adzuna), the cron had no guard against accidentally triggering full ingestion, and burned OpenRouter tokens needlessly (240 LLM calls/day).

**Why this happened:**
1. The daily ingestion makes 98 Adzuna calls — 39% of daily quota in one shot. No budget tracking.
2. The classify cron ran every 6 min with no pre-flight check (are there unclassified jobs?)
3. No rate limit headers are read or respected (`X-RateLimit-Remaining`)
4. No circuit breaker — if API returns 429, cron retries blindly next cycle
5. The crons run 24/7 even when there's no work to do

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
