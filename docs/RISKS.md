# Risk Register — aimeajob MVP

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|------------|
| 1 | LLM misclassifies CV criteria (wrong category) | Medium | High | Bounded categories reduce error space. User confirms/edits. Test with 10+ real CVs in Sprint 2. |
| 2 | LLM misclassifies job postings | Medium | High | Same bounded categories. Spot-check 20 random classifications in Sprint 3. Rerun classification if prompt needs tuning. |
| 3 | Job APIs have stale/dead postings | High | Medium | Nikolay accepted this risk. Track click-through to external URLs to measure staleness post-MVP. |
| 4 | Job APIs return duplicates across sources | Medium | Low | UNIQUE(source, external_id) prevents same-source dupes. Cross-source dedup (same job on Adzuna + Jooble) is post-MVP. |
| 5 | Supabase free tier storage limit (500MB) | Low | Medium | Monitor usage. 50K jobs with full descriptions ≈ 100-200MB. Plenty of headroom. Upgrade to Pro ($25/mo) if needed. |
| 6 | Mac Studio delivery delayed | Medium | Low | GPT-4o-mini cost is negligible at MVP scale. No blocker. |
| 7 | Adzuna/Jooble API changes or goes down | Low | High | Three sources for redundancy. If one fails, others still work. Monitor in ingestion logs. |
| 8 | Matching too strict (few results) | Medium | Medium | Threshold at 5/8 is already lenient. Can lower to 4/8 if needed. Adjacent-bucket matching on experience/seniority helps. |
| 9 | Matching too loose (irrelevant results) | Low | Medium | Show match breakdown so user can judge quality. Threshold tunable without code change. |
| 10 | EURES API too complex (SOAP/XML) | Medium | Low | Explicitly optional in Sprint 3. Adzuna + Jooble cover all target geographies. |
