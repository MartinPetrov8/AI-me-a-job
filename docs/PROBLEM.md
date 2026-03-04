# Problem Statement

## WHO
Job seekers who use LinkedIn as their primary job search channel. Typically professionals with 2+ years of experience, willing to pay for better tools (evidenced by LinkedIn Premium subscriptions).

## PROBLEM
LinkedIn's job matching is fundamentally broken — it returns thousands of irrelevant results even with filters applied. Premium subscribers get matched to wildly unrelated roles. Manual review of 2-3K postings is impossible, so relevant opportunities get buried and missed.

## CURRENT SOLUTION
Users currently:
1. Pay for LinkedIn Premium ($30-60/mo) hoping for better matches — doesn't help
2. Manually scroll through hundreds of postings, applying conservative filters that still return too many results
3. Use keyword searches, which miss relevant jobs that use different terminology
4. Some use Teal/Jobright/Careerflow for CV optimization, but matching quality remains poor

## GOAL
Reduce the job search noise-to-signal ratio from ~95% irrelevant to <30% irrelevant. A user uploads their CV and gets a shortlist of genuinely matching jobs within 2 minutes, ranked by fit across 8 structured criteria.

## SCOPE (MVP)
**IN:**
- CV upload (PDF/Word) with AI extraction of 8 structured criteria
- User confirmation/editing of extracted values
- 3-5 preference clarification questions (employment type, location, remote/hybrid/onsite, relocation, salary)
- Job matching against free API data (Adzuna, Jooble, EURES)
- Shortlist display with links to original postings
- On-demand search + 24h delta refresh
- Mobile-optimized web app
- Anonymous usage with optional email save
- Geography: EU + UK + US

**OUT OF SCOPE (post-MVP):**
- CV optimization / rewriting
- Auto-apply
- User accounts / full auth
- Advanced filters (exclude companies, specific industries, etc.)
- Company culture matching
- Salary intelligence
- LinkedIn data (scraping or integration)
- Browser extension
- Mobile native app
- Bulgarian-specific job boards (jobs.bg, zaplata.bg)
- Employer-side features

## COMPETITIVE SCAN
See `research-brief.md` and `competitor-features-detailed.md` for full analysis.

**Key finding:** 50+ competitors exist, but nearly all focus on CV optimization and auto-apply. Structured multi-criteria matching (extracting the same dimensions from BOTH the CV and the job posting) is the underserved gap. Nobody does dimension-by-dimension matching well.

## SUCCESS METRICS

**METRIC 1:** CV upload → confirmed profile in under 2 minutes (AI extraction + user confirmation)

**METRIC 2:** Job search returns results in under 10 seconds

**METRIC 3:** At least 50% of shortlisted jobs are rated "relevant" by the user (measured via optional feedback thumbs up/down — post-MVP tracking, but baseline target)

**METRIC 4:** First-time user can go from landing page to seeing matched jobs in under 5 minutes with zero account creation
