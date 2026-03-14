import { db } from '../db/index';
import { profiles, jobs, searches, searchResults } from '../db/schema';
import { eq, gt, sql, desc } from 'drizzle-orm';
import { YEARS_EXPERIENCE, EDUCATION_LEVELS, SENIORITY_LEVELS } from '../criteria';

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
}

interface JobRow {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  posted_at: Date | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  employment_type: string | null;
  is_remote: boolean | null;
  years_experience: string | null;
  education_level: string | null;
  field_of_study: string | null;
  sphere_of_expertise: string | null;
  seniority_level: string | null;
  industry: string | null;
  languages: string[] | null;
  key_skills: string[] | null;
}

function matchYearsExperience(profileValue: string, jobValue: string | null): boolean {
  if (jobValue === null) return true;
  if (!profileValue) return true; // unknown profile field = benefit of doubt
  const profileIndex = YEARS_EXPERIENCE.indexOf(profileValue as any);
  const jobIndex = YEARS_EXPERIENCE.indexOf(jobValue as any);
  if (profileIndex === -1 || jobIndex === -1) return true; // unrecognised = benefit of doubt
  return Math.abs(profileIndex - jobIndex) <= 1;
}

function matchEducationLevel(profileValue: string, jobValue: string | null): boolean {
  if (jobValue === null) return true;
  if (!profileValue) return true; // unknown profile field = benefit of doubt
  const profileIndex = EDUCATION_LEVELS.indexOf(profileValue as any);
  const jobIndex = EDUCATION_LEVELS.indexOf(jobValue as any);
  if (profileIndex === -1 || jobIndex === -1) return true; // unrecognised = benefit of doubt
  return profileIndex >= jobIndex;
}

function matchSeniorityLevel(profileValue: string, jobValue: string | null): boolean {
  if (jobValue === null) return true;
  if (!profileValue) return true; // unknown profile field = benefit of doubt
  const profileIndex = SENIORITY_LEVELS.indexOf(profileValue as any);
  const jobIndex = SENIORITY_LEVELS.indexOf(jobValue as any);
  if (profileIndex === -1 || jobIndex === -1) return true; // unrecognised = benefit of doubt
  return Math.abs(profileIndex - jobIndex) <= 1;
}

function matchLanguages(profileLanguages: string[] | null, jobLanguages: string[] | null): boolean {
  if (jobLanguages === null || jobLanguages.length === 0) return true;
  if (!profileLanguages || profileLanguages.length === 0) return true; // unknown = benefit of doubt
  const profileSet = new Set(profileLanguages.map(l => l.toLowerCase()));
  return jobLanguages.every(lang => profileSet.has(lang.toLowerCase()));
}

function matchKeySkills(profileSkills: string[] | null, jobSkills: string[] | null): boolean {
  // null OR empty = benefit of doubt (spec: "If job.key_skills IS NULL then score 1")
  if (jobSkills === null || jobSkills.length === 0) return true;
  if (!profileSkills || profileSkills.length === 0) return true; // unknown profile = benefit of doubt
  const profileSet = new Set(profileSkills.map(s => s.toLowerCase()));
  const overlapCount = jobSkills.filter(skill => profileSet.has(skill.toLowerCase())).length;
  return overlapCount >= 2;
}

function matchLocation(prefLocation: string | null, jobLocation: string | null, isRemote: boolean | null): boolean {
  if (!prefLocation) return true; // no pref = any location
  if (isRemote) return true;      // remote jobs match any location pref
  if (!jobLocation) return true;  // unknown job location = benefit of doubt
  const pref = prefLocation.toLowerCase().trim();
  const loc = jobLocation.toLowerCase();
  // Check if pref appears anywhere in location string (city, region, country)
  return loc.includes(pref) || pref.includes(loc.split(',')[0].trim());
}

function calculateMatch(profile: any, job: JobRow): { score: number; matched: string[]; unmatched: string[] } {
  const matched: string[] = [];
  const unmatched: string[] = [];

  // a) years_experience
  if (matchYearsExperience(profile.yearsExperience, job.years_experience)) {
    matched.push('years_experience');
  } else {
    unmatched.push('years_experience');
  }

  // b) education_level
  if (matchEducationLevel(profile.educationLevel, job.education_level)) {
    matched.push('education_level');
  } else {
    unmatched.push('education_level');
  }

  // c) field_of_study
  if (job.field_of_study === null || !profile.fieldOfStudy || profile.fieldOfStudy === job.field_of_study) {
    matched.push('field_of_study');
  } else {
    unmatched.push('field_of_study');
  }

  // d) sphere_of_expertise — only auto-pass null if profile also has no sphere
  if (!profile.sphereOfExpertise || job.sphere_of_expertise === null || profile.sphereOfExpertise === job.sphere_of_expertise) {
    matched.push('sphere_of_expertise');
  } else {
    unmatched.push('sphere_of_expertise');
  }

  // e) seniority_level
  if (matchSeniorityLevel(profile.seniorityLevel, job.seniority_level)) {
    matched.push('seniority_level');
  } else {
    unmatched.push('seniority_level');
  }

  // f) languages
  if (matchLanguages(profile.languages, job.languages)) {
    matched.push('languages');
  } else {
    unmatched.push('languages');
  }

  // g) industry — only auto-pass null if profile also has no industry
  if (!profile.industry || job.industry === null || profile.industry === job.industry) {
    matched.push('industry');
  } else {
    unmatched.push('industry');
  }

  // h) key_skills
  if (matchKeySkills(profile.keySkills, job.key_skills)) {
    matched.push('key_skills');
  } else {
    unmatched.push('key_skills');
  }

  return { score: matched.length, matched, unmatched };
}

export async function findMatches(profileId: string, options?: { delta?: boolean }): Promise<MatchResult> {
  // Fetch profile
  const profileResult = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (profileResult.length === 0) {
    throw new Error('Profile not found');
  }
  const profile = profileResult[0];

  // Fetch jobs with optional delta filter
  let jobsQuery = db.select({
    id: jobs.id,
    title: jobs.title,
    company: jobs.company,
    location: jobs.location,
    url: jobs.url,
    posted_at: jobs.postedAt,
    salary_min: jobs.salaryMin,
    salary_max: jobs.salaryMax,
    salary_currency: jobs.salaryCurrency,
    employment_type: jobs.employmentType,
    is_remote: jobs.isRemote,
    years_experience: jobs.yearsExperience,
    education_level: jobs.educationLevel,
    field_of_study: jobs.fieldOfStudy,
    sphere_of_expertise: jobs.sphereOfExpertise,
    seniority_level: jobs.seniorityLevel,
    industry: jobs.industry,
    languages: jobs.languages,
    key_skills: jobs.keySkills,
  }).from(jobs);

  if (options?.delta && profile.lastSearchAt) {
    jobsQuery = jobsQuery.where(gt(jobs.ingestedAt, profile.lastSearchAt)) as any;
  }

  const allJobs = (await jobsQuery).filter(job => {
    // Only exclude jobs that have no classified fields AND no title — pure junk rows
    const hasClassifiedField = job.sphere_of_expertise !== null ||
      job.key_skills !== null ||
      job.industry !== null ||
      job.seniority_level !== null ||
      job.title !== null;  // null title = true junk; null criteria = benefit of doubt
    if (!hasClassifiedField) return false;

    // Apply preference pre-filters
    // Work mode
    if (profile.prefWorkMode) {
      if (profile.prefWorkMode === 'Remote' && job.is_remote === false) return false;
      if (profile.prefWorkMode === 'On-site' && job.is_remote === true) return false;
      // 'Hybrid' and 'Any' = no filter
    }

    // Employment type
    if (profile.prefEmploymentType && profile.prefEmploymentType.length > 0 && job.employment_type) {
      if (!profile.prefEmploymentType.includes(job.employment_type)) return false;
    }

    // Location
    if (profile.prefLocation) {
      if (!matchLocation(profile.prefLocation, job.location, job.is_remote)) return false;
    }

    // Salary min — only filter when job has salary data
    if (profile.prefSalaryMin && job.salary_max !== null) {
      if (job.salary_max < profile.prefSalaryMin) return false;
    }

    return true;
  });

  // Calculate matches
  const scoredJobs = allJobs.map(job => {
    const match = calculateMatch(profile, job);
    return {
      job,
      score: match.score,
      matched: match.matched,
      unmatched: match.unmatched,
    };
  });

  // Filter >= 5, sort by score DESC then posted_at DESC NULLS LAST, limit 50
  const filteredJobs = scoredJobs
    .filter(item => item.score >= 5)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      // Sort by posted_at DESC NULLS LAST
      if (a.job.posted_at === null && b.job.posted_at === null) return 0;
      if (a.job.posted_at === null) return 1;
      if (b.job.posted_at === null) return -1;
      return b.job.posted_at.getTime() - a.job.posted_at.getTime();
    })
    .slice(0, 50);

  const results: MatchedJob[] = filteredJobs.map(item => ({
    job_id: item.job.id,
    title: item.job.title,
    company: item.job.company,
    location: item.job.location,
    url: item.job.url,
    posted_at: item.job.posted_at,
    match_score: item.score,
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
  };
}
