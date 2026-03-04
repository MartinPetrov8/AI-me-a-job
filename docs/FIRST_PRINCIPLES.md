# First-Principles Analysis: AI Job Matcher

## 5 Whys — Root Cause Decomposition

**Surface problem:** Job seekers can't find relevant jobs on LinkedIn despite paying for Premium.

**Why #1:** Why can't they find relevant jobs?
→ LinkedIn returns 2-3K results even with filters applied. Manual review is impossible at that volume.

**Why #2:** Why does LinkedIn return so many irrelevant results?
→ LinkedIn's matching is keyword-based and biased toward sponsored/paid postings. It optimizes for employer revenue, not candidate fit. A data scientist gets matched to "office secretary" and "general manager" because of shared surface keywords.

**Why #3:** Why doesn't LinkedIn fix this? They have the data and the AI talent.
→ Misaligned incentives. LinkedIn makes money when employers pay for job ads and promoted listings. Better matching would reduce the number of applications per posting (good for candidates, bad for LinkedIn's "apply" metrics that they sell to employers). Premium revenue comes from hope, not results.

**Why #4:** Why don't existing AI job tools (Teal, Jobright, Careerflow) solve this?
→ They focus on the wrong end. Most tools optimize the CV (rewrite it, ATS-score it, auto-apply). They assume the matching problem is about presentation — make yourself look good and more jobs will fit. But the real problem is filtering: too many irrelevant postings, not enough signal.

**Why #5:** Why is filtering so hard?
→ Because job postings are unstructured text with inconsistent formats, and a candidate's fit depends on multi-dimensional alignment (skills + seniority + industry + geography + culture + compensation), not keyword overlap. You need structured extraction on BOTH sides (CV and job posting) to do real matching. Nobody does this well.

---

## Core Insight

The root problem is **structural asymmetry**: candidates are multi-dimensional, job postings are multi-dimensional, but the matching layer (LinkedIn) reduces both to keyword bags. Fix the matching layer by extracting structured attributes from both sides and comparing them dimension-by-dimension.

## Why This Can Work as an MVP

1. **The extraction problem is now solvable** — LLMs can reliably extract structured categories from unstructured text (CVs and job postings). This was hard 3 years ago. It's commodity capability now.
2. **Free job data exists** — Adzuna, Jooble, EURES, and public ATS APIs provide 50K-200K listings at zero cost. No LinkedIn scraping needed.
3. **The incumbent won't fix it** — LinkedIn's business model is structurally opposed to better matching. This isn't a feature gap; it's an incentive misalignment.
4. **Competitors miss the point** — 90% of AI job tools focus on CV optimization and auto-apply. The matching problem remains unsolved.

## Key Risk

The biggest risk isn't technical — it's **adoption**. The user has to trust a new tool over LinkedIn, upload their CV (privacy concern), and change their workflow. The MVP must deliver value in under 2 minutes from first visit to prove itself.

---

## Contrarian View (Steel-Man Against)

- LinkedIn has 1B+ users, infinite data, and is actively investing in AI. Their matching will improve.
- Google launched "Google for Jobs" — another giant in the space.
- The job search market is brutally competitive (50+ tools).
- If matching is truly the differentiator, it's also the hardest thing to prove before someone commits to uploading their CV.

**Counter:** LinkedIn's incentive structure prevents them from truly fixing this. Google for Jobs aggregates but doesn't match. And the 50+ competitors are all building the same thing (CV optimization), leaving matching as genuinely underserved.
