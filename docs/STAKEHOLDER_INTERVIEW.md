# Stakeholder Interview Summary

**Date:** March 3, 2026
**Participants:** Nikolay Georgiev (Product Owner), Martin Petrov (Technical Lead / Investor)
**Interviewer:** Cookie (PM)
**Channel:** WhatsApp group "AI find-a-job"

---

## User Story (from Nikolay)

**Target user:** Job seeker whose primary channel is LinkedIn.

**Two core problems:**
1. LinkedIn Premium's AI suggestions are useless — positions the user as "top choice" for wildly unrelated roles (general manager to office secretary). This is despite paying for Premium.
2. LinkedIn's filtering is inferior — even with conservative filter settings, returns 2-3K postings. Manual review at that volume is impossible. Most results are obviously unsuitable.

**Root pain:** Relevant opportunities exist in the market but there's no viable way to surface them. The haystack is too big, the needle-finding tools are broken.

---

## MVP Definition (from Nikolay)

**Platform:** Web-based, mobile-optimized.

### Function 1: CV Evaluator
- User uploads CV (PDF or Word)
- AI extracts 8 predefined criteria (categorical labels, not numeric scores)
- Presents extracted values to user for confirmation
- If data is missing, leaves blank and asks user to fill in
- User confirms or manually edits each criterion

### Function 2: Job Matching
- Pulls job postings from free third-party APIs (Adzuna, Jooble, EURES)
- AI quantifies each posting across the same 8 criteria
- Matches against user's confirmed CV profile
- Returns shortlist with links to original job postings
- First search is on-demand; subsequent searches pull only last-24h delta

### Post-CV Clarification Questions (3-5)
After extracting CV data, ask preference questions:
- Employment type? (Full-time / Part-time / Contract / Freelance)
- Preferred locations? (Countries/cities or "Anywhere")
- Remote, hybrid, or on-site?
- Willing to relocate?
- Minimum salary expectation? (Optional, ranges)

---

## The 8 CV-Extracted Criteria

| # | Criterion | Type | Labels |
|---|-----------|------|--------|
| 1 | Years of experience | Categorical | 0-1, 2-4, 5-9, 10-15, 15+ |
| 2 | Education level | Categorical | High school, Bachelor's, Master's, PhD |
| 3 | Field of study | Categorical (bounded, 12 options) | STEM, Business & Economics, Law, Medicine & Health, Social Sciences, Humanities, Arts & Design, Education, Agriculture & Environment, Communications & Media, Trades & Technical, Other |
| 4 | Sphere of expertise | Categorical | Data Science, Sales, HR, Engineering, Marketing, Finance, Operations, Product, Design, Legal, Healthcare, Education, IT/DevOps, Consulting, Other |
| 5 | Seniority level | Categorical (bounded, 6 options) | Entry, Junior, Mid, Senior, Lead/Manager, Director+ |
| 6 | Languages | List | English, German, French, Bulgarian, etc. |
| 7 | Industry | Categorical (bounded, 15 options) | Technology, Finance & Banking, Healthcare, Manufacturing, Retail & E-commerce, Consulting, Telecom, Energy, Real Estate, Government, Education, Media & Entertainment, Logistics & Transport, Hospitality, Other |
| 8 | Key skills | List (5-8 items) | Extracted technical/domain skills |

**Seniority inference logic:** AI infers from job titles, years of experience, scope of responsibility, and career progression pattern. User always confirms/overrides.

**Finite label constraint:** Criteria 3, 5, and 7 are bounded to broad categories (12, 6, and 15 options respectively). No open-ended labels for these.

---

## Decisions Made

| # | Decision | Decided By | Date |
|---|----------|-----------|------|
| 1 | Categorical labels, not numeric scores | Nikolay | Mar 3 |
| 2 | AI extracts → user confirms/edits → then clarification questions | Nikolay | Mar 3 |
| 3 | Free third-party APIs for MVP (Adzuna, Jooble, EURES) | Nikolay (accepted Cookie's rec) | Mar 3 |
| 4 | First search on-demand, subsequent 24h delta only | Nikolay | Mar 3 |
| 5 | All industries, EU + UK + US geography for MVP | Cookie (accepted by Nikolay) | Mar 3 |
| 6 | MVP output is a simple list with links — no save/dismiss | Nikolay | Mar 3 |
| 7 | Advanced filters (remote, salary, exclusions) are post-MVP preferences | Nikolay | Mar 3 |
| 8 | Auth: anonymous upload-and-go, optional email save | Cookie (accepted) | Mar 3 |
| 9 | Remaining criteria proposed by Cookie from research | Nikolay | Mar 3 |
| 10 | Bounded categories for field of study, seniority, industry | Nikolay | Mar 3 |
| 11 | Location + employment type are preference questions, not CV-extracted | Nikolay | Mar 3 |
| 12 | Domain: aimeajob (.com and .ai both available) | Nikolay | Mar 3 |
| 13 | Business model: freemium or B2C subscription | Nikolay | Mar 3 |
| 14 | Tagline direction: "LinkedIn has 15M job postings. We show you which ones actually matter." | Nikolay | Mar 3 |
| 15 | Nikolay's role: testing, UX feedback, user validation/recruitment | Nikolay | Mar 3 |
| 16 | Hosting: Vercel for frontend (scales best), separate backend | Martin | Mar 3 |
| 17 | LLM: local on Mac Studio M4 Max when it arrives; GPT-4o-mini/Haiku for prototyping until then | Martin | Mar 3 |
| 18 | Budget: local/minimal — near-zero marginal cost per user | Martin | Mar 3 |

---

## Architecture Direction (from Martin, Mar 3)

Martin's priorities for Phase 1:
- **Scalability from day 1** — must accommodate 5, 10, 100, 1000 users/day
- **Local-first** — LLM inference on Mac Studio, minimize external API costs
- **Vercel** — frontend hosting, best auto-scaling option

Agreed architecture outline:
- **Vercel** — Next.js frontend + lightweight API routes
- **Mac Studio (M4 Max, 128GB)** — LLM inference for CV extraction + job classification
- **Postgres** — Job index, user profiles, classified criteria (Supabase or Vercel Postgres)
- **Cron job** — Periodic job ingestion from APIs → LLM classification → indexed in DB

Key scalability insight: LLM calls happen at two points only:
1. Once per CV upload (user-facing, ~seconds)
2. Once per job posting at ingestion time (background, batch)

Matching at query time is pure database work — no LLM cost per search. This is how 1000 users/day stays cheap.

---

## Nikolay's Answers (Mar 4)

| # | Question | Answer | Decided By |
|---|----------|--------|------------|
| 1 | Language support | English only for MVP | Nikolay |
| 2 | Multiple CVs per person | One CV. Used for filtering/matching only — user applies with whatever CV they want | Nikolay |
| 3 | Match transparency | Yes — show WHY a job matched (which criteria aligned) | Nikolay |
| 4 | Match threshold | Rank by number of matched criteria. Minimum 5/8 to show a result | Nikolay |
| 5 | Job freshness | Everything available. Also serves as a data quality check on the APIs | Nikolay |

---

## Quotes (Verbatim)

**Nikolay:**
> "LinkedIn positions him as a top choice for roles ranging from general manager to office secretary."

> "The filtering capabilities embedded in the LinkedIn job search are extremely inferior."

> "There are a lot of opportunities but there is not a viable way to encompass them all and ensure that our user does see the relevant job offerings that fit his profile."

> "The AI will pull those 10 criteria out of the CV of the user and will provide deterministic values for each."

> "The labels of criteria 3, 5 and 8 should have a finite number of options. We should aim to limit those to broader categories rather than 100 individual label options."

**Martin:**
> "Even if it's MVP, we need to think about scalability. We need to be able to accommodate 5, 10, 100, 1,000 users per day."

> "For the heavy matching we'd figure out the best LLM when the Mac Studio comes — it'd be local."
