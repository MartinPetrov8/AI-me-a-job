import { db } from '../db/index';
import { profiles, jobs, searches, searchResults } from '../db/schema';
import { eq, gt, sql } from 'drizzle-orm';
import { YEARS_EXPERIENCE, EDUCATION_LEVELS, SENIORITY_LEVELS } from '../criteria';
import { cosineSimilarity } from './cosine';

export interface MatchedJob {
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  posted_at: Date | null;
  match_score: number;
  matched_criteria: string[];
  unmatched_criteria: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  employment_type: string | null;
  is_remote: boolean | null;
}

export interface MatchResult {
  results: MatchedJob[];
  total: number;
  search_id: string;
  max_score: number; //8 base criteria + 1 if location preference is set
}

export async function findMatches(
  profileId: string,
  options?: {
    delta?: boolean;
    sort?: string;
    salaryMin?: number;
    salaryMax?: number;
    postedWithin?: number;
    // Runtime overrides — applied on top of stored profile preferences
    locationOverride?: string;
    workModeOverride?: string;
    employmentTypeOverride?: string;
  }
): Promise<MatchResult> {
  // Fetch profile with embedding
  const profileResult = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (profileResult.length === 0) {
    throw new Error('Profile not found');
  }
  const profile = profileResult[0];

  // Apply runtime overrides (from Edit Filters panel) on top of stored preferences
  if (options?.locationOverride !== undefined) profile.prefLocation = options.locationOverride || null;
  if (options?.workModeOverride !== undefined) profile.prefWorkMode = options.workModeOverride || null;
  if (options?.employmentTypeOverride !== undefined) {
    profile.prefEmploymentType = options.employmentTypeOverride
      ? [options.employmentTypeOverride]
      : [];
  }

  // Build SQL query parameters
  const yearsScale = YEARS_EXPERIENCE;
  const eduScale = EDUCATION_LEVELS;
  const senScale = SENIORITY_LEVELS;

  // Construct WHERE clause conditions dynamically
  const whereConditions: any[] = [sql`classified_at IS NOT NULL`];

  // Hard pre-filters
  if (profile.prefWorkMode) {
    if (profile.prefWorkMode === 'Remote') {
      whereConditions.push(sql`(is_remote IS NULL OR is_remote = true)`);
    } else if (profile.prefWorkMode === 'On-site') {
      whereConditions.push(sql`(is_remote IS NULL OR is_remote = false)`);
    }
    // 'Hybrid' and 'Any' = no filter
  }

  if (profile.prefEmploymentType && profile.prefEmploymentType.length > 0) {
    whereConditions.push(sql`(employment_type IS NULL OR employment_type = ANY(${profile.prefEmploymentType}))`);
  }

  if (profile.prefSalaryMin !== null && profile.prefSalaryMin !== undefined) {
    whereConditions.push(sql`(salary_max IS NULL OR salary_max >= ${profile.prefSalaryMin})`);
  }

  if (options?.salaryMin !== undefined) {
    whereConditions.push(sql`(salary_max IS NULL OR salary_max >= ${options.salaryMin})`);
  }

  if (options?.salaryMax !== undefined) {
    whereConditions.push(sql`(salary_min IS NULL OR salary_min <= ${options.salaryMax})`);
  }

  if (options?.postedWithin !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.postedWithin);
    whereConditions.push(sql`(posted_at IS NULL OR posted_at >= ${cutoffDate})`);
  }

  if (options?.delta && profile.lastSearchAt) {
    whereConditions.push(gt(jobs.ingestedAt, profile.lastSearchAt));
  }

  // Combine WHERE conditions
  const whereSql = whereConditions.length > 1
    ? sql`${whereConditions[0]} AND ${sql.join(whereConditions.slice(1), sql` AND `)}`
    : whereConditions[0];

  // PHASE A: SQL structured scoring (returns up to 300 candidates)
  const locationPattern = profile.prefLocation ? `%${profile.prefLocation}%` : null;

  const candidatesQuery = sql`
    SELECT
      id, title, company, location, url, posted_at,
      salary_min, salary_max, salary_currency, employment_type, is_remote,
      embedding,

      -- Per-criterion scores
      CASE 
        WHEN years_experience IS NULL THEN 1
        WHEN array_position(${yearsScale}::text[], years_experience) IS NULL THEN 1
        WHEN ABS(
          array_position(${yearsScale}::text[], years_experience) - 
          array_position(${yearsScale}::text[], ${profile.yearsExperience}::text)
        ) <= 1 THEN 1 
        ELSE 0 
      END AS c_years,

      CASE 
        WHEN education_level IS NULL THEN 1
        WHEN array_position(${eduScale}::text[], education_level) IS NULL THEN 1
        WHEN array_position(${eduScale}::text[], education_level) <= 
             array_position(${eduScale}::text[], ${profile.educationLevel}::text)
        THEN 1 
        ELSE 0 
      END AS c_education,

      CASE 
        WHEN field_of_study IS NULL THEN 1
        WHEN field_of_study = ${profile.fieldOfStudy} THEN 1 
        ELSE 0 
      END AS c_field,

      CASE 
        WHEN sphere_of_expertise IS NULL THEN 1
        WHEN sphere_of_expertise = ${profile.sphereOfExpertise} THEN 1 
        ELSE 0 
      END AS c_sphere,

      CASE 
        WHEN seniority_level IS NULL THEN 1
        WHEN array_position(${senScale}::text[], seniority_level) IS NULL THEN 1
        WHEN ABS(
          array_position(${senScale}::text[], seniority_level) - 
          array_position(${senScale}::text[], ${profile.seniorityLevel}::text)
        ) <= 1 THEN 1 
        ELSE 0 
      END AS c_seniority,

      CASE 
        WHEN languages IS NULL OR cardinality(languages) = 0 THEN 1
        WHEN languages <@ ${profile.languages || []}::text[] THEN 1 
        ELSE 0 
      END AS c_languages,

      CASE 
        WHEN industry IS NULL THEN 1
        WHEN industry = ${profile.industry} THEN 1 
        ELSE 0 
      END AS c_industry,

      CASE 
        WHEN key_skills IS NULL OR cardinality(key_skills) = 0 THEN 1
        WHEN cardinality(ARRAY(
          SELECT unnest(key_skills) INTERSECT SELECT unnest(${profile.keySkills || []}::text[])
        )) >= 2 THEN 1 
        ELSE 0 
      END AS c_skills,

      CASE
        WHEN ${profile.prefLocation}::text IS NULL THEN NULL
        WHEN is_remote = true THEN 1
        WHEN location IS NULL THEN 1
        WHEN location ILIKE ${locationPattern} THEN 2
        ELSE 0
      END AS c_location

    FROM jobs
    WHERE ${whereSql}
  `;

  const havingAndLimit = sql`
    HAVING (
      c_years + c_education + c_field + c_sphere + c_seniority +
      c_languages + c_industry + c_skills + COALESCE(c_location, 0)
    ) >= 4
    ORDER BY (
      c_years + c_education + c_field + c_sphere + c_seniority +
      c_languages + c_industry + c_skills + COALESCE(c_location, 0)
    ) DESC
    LIMIT 300
  `;

  const finalQuery = sql`${candidatesQuery} ${havingAndLimit}`;

  // drizzle-orm/postgres-js returns rows as a RowList (array-like) directly
  const candidatesRaw = await db.execute(finalQuery);
  const candidates = Array.from(candidatesRaw) as any[];

  // PHASE B: JS vector re-rank (on 300 candidates)
  const MAX_SQL_SCORE = profile.prefLocation ? 9 : 8;
  const profileEmbedding = profile.embedding as number[] | null;

  const scored = candidates.map((job: any) => {
    const sqlScore = 
      (job.c_years || 0) +
      (job.c_education || 0) +
      (job.c_field || 0) +
      (job.c_sphere || 0) +
      (job.c_seniority || 0) +
      (job.c_languages || 0) +
      (job.c_industry || 0) +
      (job.c_skills || 0) +
      (job.c_location || 0);

    const sqlNorm = sqlScore / MAX_SQL_SCORE;

    let hybridScore: number;
    const jobEmbedding = job.embedding as number[] | null;

    if (profileEmbedding && jobEmbedding) {
      const cosine = cosineSimilarity(profileEmbedding, jobEmbedding);
      hybridScore = 0.65 * sqlNorm + 0.35 * cosine;
    } else {
      // Graceful degradation: no embedding = use SQL score only
      hybridScore = sqlNorm;
    }

    // Build matched/unmatched criteria lists
    const matched: string[] = [];
    const unmatched: string[] = [];

    if (job.c_years === 1) matched.push('years_experience');
    else if (job.c_years === 0) unmatched.push('years_experience');

    if (job.c_education === 1) matched.push('education_level');
    else if (job.c_education === 0) unmatched.push('education_level');

    if (job.c_field === 1) matched.push('field_of_study');
    else if (job.c_field === 0) unmatched.push('field_of_study');

    if (job.c_sphere === 1) matched.push('sphere_of_expertise');
    else if (job.c_sphere === 0) unmatched.push('sphere_of_expertise');

    if (job.c_seniority === 1) matched.push('seniority_level');
    else if (job.c_seniority === 0) unmatched.push('seniority_level');

    if (job.c_languages === 1) matched.push('languages');
    else if (job.c_languages === 0) unmatched.push('languages');

    if (job.c_industry === 1) matched.push('industry');
    else if (job.c_industry === 0) unmatched.push('industry');

    if (job.c_skills === 1) matched.push('key_skills');
    else if (job.c_skills === 0) unmatched.push('key_skills');

    if (job.c_location === 2 || job.c_location === 1) matched.push('location');
    else if (job.c_location === 0) unmatched.push('location');

    return {
      job,
      sqlScore,
      hybridScore,
      matched,
      unmatched,
    };
  });

  // Sort by hybrid score DESC and take top 50
  const topMatches = scored
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, 50);

  const results: MatchedJob[] = topMatches.map(item => ({
    job_id: item.job.id,
    title: item.job.title,
    company: item.job.company,
    location: item.job.location,
    url: item.job.url,
    posted_at: item.job.posted_at,
    match_score: item.sqlScore, // API contract: match_score = SQL structured score
    matched_criteria: item.matched,
    unmatched_criteria: item.unmatched,
    salary_min: item.job.salary_min,
    salary_max: item.job.salary_max,
    salary_currency: item.job.salary_currency,
    employment_type: item.job.employment_type,
    is_remote: item.job.is_remote,
  }));

  // Create searches record
  const searchRecord = await db.insert(searches).values({
    profileId,
    resultCount: results.length,
    isDelta: options?.delta || false,
  }).returning();

  const searchId = searchRecord[0].id;

  // Create search_results records
  if (results.length > 0) {
    await db.insert(searchResults).values(
      results.map((result, index) => ({
        searchId,
        jobId: result.job_id,
        matchScore: result.match_score,
        matchedCriteria: result.matched_criteria,
        rank: index + 1,
      }))
    );
  }

  // Update profile.last_search_at
  await db.update(profiles).set({ lastSearchAt: new Date() }).where(eq(profiles.id, profileId));

  return {
    results,
    total: results.length,
    search_id: searchId,
    max_score: MAX_SQL_SCORE,
  };
}

/**
 * scoreLocation — pure JS utility kept for unit testing and future use.
 * Mirrors the SQL CASE expression for c_location:
 *   2 = city/country match found in jobLocation
 *   1 = neutral (remote job, null location, or no prefLocation)
 *   0 = location set but no match
 */
export function scoreLocation(
  prefLocation: string | null,
  jobLocation: string | null,
  isRemote: boolean | null
): number {
  if (!prefLocation) return 1;
  if (isRemote) return 1;
  if (!jobLocation) return 1;
  const loc = jobLocation.toLowerCase();
  const pref = prefLocation.toLowerCase();
  // Match if jobLocation contains the pref city/country (same logic as SQL ILIKE %pref%)
  if (loc.includes(pref)) return 2;
  return 0;
}
