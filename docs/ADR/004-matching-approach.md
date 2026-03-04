# ADR-004: Matching Approach — Dimension-by-Dimension SQL

## Decision
Match jobs to profiles using dimension-by-dimension comparison of the 8 shared criteria, computed in SQL at query time.

## Context
Core differentiator of the product. Must be fast (user-facing), transparent (show why), and have a tunable threshold.

## Options Considered
1. **SQL dimension matching** — Compare each criterion, count matches, filter by threshold
2. **Vector similarity (embeddings)** — Embed CV + jobs, nearest-neighbor search
3. **LLM-based matching** — Send profile + N jobs to LLM, ask for ranking
4. **Hybrid (SQL filter + LLM re-rank)** — SQL narrows, LLM ranks top-N

## Chosen: SQL dimension matching

**Why:**
- **Transparency:** Can list exactly which criteria matched/didn't (Nikolay's requirement)
- **Speed:** Pure DB query, <100ms even at 100K jobs with proper indexes
- **Cost:** Zero LLM cost per search (LLM only at ingestion)
- **Predictability:** Deterministic. Same profile + same jobs = same results.
- **Threshold tunable:** 5/8 minimum, ranked by score. Easy to adjust.
- **Scalability:** Matching cost doesn't increase with user count.

**Why not vectors:** Embeddings are opaque — can't explain WHY something matched. Also overkill when we have structured categorical data.

**Why not LLM ranking:** Too expensive per search. 1000 users/day × average 3 searches = 3000 LLM calls/day just for ranking.

## Matching Logic

Per criterion, a "match" is defined as:
| Criterion | Match = |
|-----------|---------|
| years_experience | Exact OR adjacent bucket |
| education_level | Profile ≥ Job requirement |
| field_of_study | Exact |
| sphere_of_expertise | Exact |
| seniority_level | Exact OR ±1 level |
| languages | Job required ⊆ Profile known |
| industry | Exact |
| key_skills | ≥2 overlapping skills |

Score = count of matches (0-8). Show results where score ≥ 5. Rank by score DESC, then posted_at DESC.

## Consequences
- "Fuzzy" matching limited to adjacent buckets and skill overlap
- No semantic understanding (job says "ML Engineer", profile says "Machine Learning" — handled by bounded categories, but edge cases exist)
- Post-MVP: could add LLM re-ranking of top-20 results for better ordering
