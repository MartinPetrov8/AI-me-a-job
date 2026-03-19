# Security

This document describes security measures implemented in the AI Job Matcher application.

## Authentication & Authorization

### IDOR Prevention (Sprint K)

The application prevents Insecure Direct Object Reference (IDOR) vulnerabilities in the job matching endpoints.

**Problem**: The matching engine function `findMatches()` accepts a `profile_id` parameter. Without proper validation, any user who guesses another user's profile_id could retrieve their match results.

**Solution**: Both search endpoints (`/api/search` and `/api/search/delta`) now implement defense-in-depth:

1. **Restore Token Validation**: Each request must include an `X-Restore-Token` header that matches the profile's restore token
2. **User ID Scoping**: After token validation, the endpoint queries the profiles table to extract the `userId` and passes it to `findMatches()`. This ensures the matching engine can enforce user-level access control if needed in future enhancements.

**Implementation Details**:
- Endpoint: `POST /api/search`
- Endpoint: `POST /api/search/delta`
- Token validation: `validateRestoreToken(profile_id, token)` (throws 401 Response on failure)
- User extraction: Query `profiles` table for `userId` where `id = profile_id`
- Engine call: `findMatches(profile_id, { ..., userId })`

**Testing**: See `tests/api/search-idor.test.ts` for integration tests covering valid/invalid tokens and profile ownership checks.

### Restore Token Flow

The application uses restore tokens instead of traditional session cookies for proof-of-concept authentication.

**Current Implementation**:
- Each profile has a unique `restore_token` (UUID)
- Users save their search results and receive a restore link containing the token
- The token is included in the `X-Restore-Token` header for API requests
- `validateRestoreToken()` verifies token ownership by querying `users JOIN profiles`

**Limitations**:
- Tokens do not expire
- No rate limiting on token validation
- Tokens are transmitted in URL query parameters (restore links)

**Future Work**: Replace with proper session-based authentication before scaling to production.

## Job Classification Pipeline

### Automated LLM Classification (Sprint K)

All ingested jobs are automatically classified using LLM (Anthropic Claude Haiku 4.5) to extract structured criteria for matching.

**Classification Fields**:
- `seniority_level`: Junior, Mid, Senior, Staff, Principal, C-level, Other
- `work_mode`: Remote, Hybrid, On-site
- `employment_type`: Full-time, Part-time, Contract, Internship, Other
- `requires_degree`: boolean
- `visa_sponsorship`: boolean
- `skills`: array of extracted technical skills

**Pipeline Integration**:
- When jobs are ingested via `ingestAllSources()`, the function calls `classifyJobsById(jobIds)` after upserting jobs
- Classification runs in batches of 20 jobs (`CLASSIFY_CHUNK_SIZE`)
- Already-classified jobs are skipped (idempotent: checks `classified_at` timestamp)
- LLM model: `claude-haiku-4-5` via Anthropic SDK

**Error Handling**:
- Partial failures are logged but do not block ingestion
- Failed classifications set `classified_at` to `null` for future retries

**Backlog Script**:

For existing unclassified jobs, run:

```bash
npx tsx scripts/classify-backlog.ts
```

This script:
- Counts total and unclassified jobs
- Classifies up to 500 unclassified jobs in batches
- Prints summary with success/failure counts
- Exits with code 1 if any jobs failed

The script is idempotent and safe to re-run.

**Testing**: Classification tests use mocked Anthropic client responses. See `tests/lib/llm/classify-job.test.ts` and `tests/lib/llm/batch-classify.test.ts`.

## API Key Management

**DO NOT hardcode API keys in source code.**

- Store keys in `.env` (gitignored)
- Reference via `process.env.ANTHROPIC_API_KEY` or similar
- In tests, use `vi.stubEnv()` to mock environment variables
- The commit hook blocks common key patterns

## Dependencies

All dependencies are pinned in `package-lock.json` to ensure reproducible builds.

**Third-party LLM Services**:
- Anthropic API (Claude Haiku 4.5) for job classification
- Configured via `@anthropic-ai/sdk`

**Database**:
- Supabase Postgres (hosted)
- Connection string in `.env` as `DATABASE_URL`

## Future Security Enhancements

1. Replace restore tokens with proper session management
2. Add rate limiting to API endpoints
3. Implement CSRF protection
4. Add request signing for public-facing APIs
5. Implement role-based access control (RBAC) for admin features
6. Add audit logging for sensitive operations
7. Implement token expiration and refresh flow
