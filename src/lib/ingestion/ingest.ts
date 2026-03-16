import { db } from '../db';
import { jobs } from '../db/schema';
import { and, lt, ne, or, isNull } from 'drizzle-orm';
import { fetchAllAdzunaJobs } from './adzuna';
import { fetchJoobleJobs } from './jooble';
import { fetchDevBgJobs } from './devbg';
import { fetchJobsBgJobs } from './jobsbg';
import { normalizeUrl, computeContentHash } from './dedup';
import { RawJobPosting, IngestionResult } from './types';
import { classifyJobsById, classifyUnclassifiedJobs } from '../llm/batch-classify';

const JOOBLE_SEARCHES = [
  { keywords: 'software developer', location: '' },
  { keywords: 'data scientist', location: '' },
  { keywords: 'product manager', location: '' },
  { keywords: 'marketing manager', location: '' },
  { keywords: 'finance analyst', location: '' },
];

interface UpsertResult { newCount: number; errorCount: number; insertedIds: string[]; }

async function upsertJobs(postings: RawJobPosting[]): Promise<UpsertResult> {
  let newCount = 0;
  let errorCount = 0;
  const insertedIds: string[] = [];

  for (const posting of postings) {
    try {
      const canonicalUrl = normalizeUrl(posting.url);
      const contentHash = computeContentHash(
        posting.title,
        posting.company,
        posting.country,
        posting.posted_at,
      );

      const returned = await db
        .insert(jobs)
        .values({
          externalId: posting.external_id,
          source: posting.source,
          title: posting.title,
          company: posting.company,
          location: posting.location,
          country: posting.country,
          url: posting.url,
          descriptionRaw: posting.description_raw,
          salaryMin: posting.salary_min,
          salaryMax: posting.salary_max,
          salaryCurrency: posting.salary_currency,
          employmentType: posting.employment_type,
          isRemote: posting.is_remote,
          postedAt: posting.posted_at,
          canonicalUrl,
          contentHash,
        })
        .onConflictDoUpdate({
          target: [jobs.source, jobs.externalId],
          set: {
            title: posting.title,
            company: posting.company,
            location: posting.location,
            url: posting.url,
            descriptionRaw: posting.description_raw,
            salaryMin: posting.salary_min,
            salaryMax: posting.salary_max,
            salaryCurrency: posting.salary_currency,
            employmentType: posting.employment_type,
            isRemote: posting.is_remote,
            postedAt: posting.posted_at,
            canonicalUrl,
            contentHash,
          },
        })
        .returning({ id: jobs.id, classifiedAt: jobs.classifiedAt });

      newCount++;
      for (const row of returned ?? []) {
        if (row.classifiedAt === null) insertedIds.push(row.id);
      }
    } catch (err) {
      errorCount++;
    }
  }

  return { newCount, errorCount, insertedIds };
}

async function cleanupOldJobs(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // Use ingestedAt as fallback when postedAt is null — ensures null-postedAt jobs still get cleaned (ISSUE-F fix)
  const deleted = await db
    .delete(jobs)
    .where(
      or(
        lt(jobs.postedAt, thirtyDaysAgo),
        and(isNull(jobs.postedAt), lt(jobs.ingestedAt, thirtyDaysAgo))
      )
    )
    .returning({ id: jobs.id });

  return deleted.length;
}

async function truncateOldDescriptions(): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const updated = await db
    .update(jobs)
    .set({ descriptionRaw: '' })
    .where(
      and(
        or(
          lt(jobs.postedAt, sevenDaysAgo),
          and(isNull(jobs.postedAt), lt(jobs.ingestedAt, sevenDaysAgo))
        ),
        ne(jobs.descriptionRaw, '')
      )
    )
    .returning({ id: jobs.id });

  return updated.length;
}

export async function ingestAllSources(): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];

  // Adzuna
  const adzunaJobs = await fetchAllAdzunaJobs();
  const adzunaUpsert = await upsertJobs(adzunaJobs);
  if (adzunaUpsert.insertedIds.length > 0) await classifyJobsById(adzunaUpsert.insertedIds);
  results.push({ source: 'adzuna', fetched: adzunaJobs.length, new: adzunaUpsert.newCount, errors: adzunaUpsert.errorCount, deleted: 0 });

  // Jooble
  let allJoobleJobs: RawJobPosting[] = [];
  for (const search of JOOBLE_SEARCHES) {
    allJoobleJobs.push(...await fetchJoobleJobs(search.keywords, search.location));
  }
  const joobleUpsert = await upsertJobs(allJoobleJobs);
  if (joobleUpsert.insertedIds.length > 0) await classifyJobsById(joobleUpsert.insertedIds);
  results.push({ source: 'jooble', fetched: allJoobleJobs.length, new: joobleUpsert.newCount, errors: joobleUpsert.errorCount, deleted: 0 });

  // dev.bg
  try {
    const devBgJobs = await fetchDevBgJobs();
    const devBgUpsert = await upsertJobs(devBgJobs);
    if (devBgUpsert.insertedIds.length > 0) await classifyJobsById(devBgUpsert.insertedIds);
    results.push({ source: 'dev_bg', fetched: devBgJobs.length, new: devBgUpsert.newCount, errors: devBgUpsert.errorCount, deleted: 0 });
  } catch (err) {
    results.push({ source: 'dev_bg', fetched: 0, new: 0, errors: 1, deleted: 0 });
  }

  // jobs.bg
  try {
    const jobsBgJobs = await fetchJobsBgJobs();
    const jobsBgUpsert = await upsertJobs(jobsBgJobs);
    if (jobsBgUpsert.insertedIds.length > 0) await classifyJobsById(jobsBgUpsert.insertedIds);
    results.push({ source: 'jobs_bg', fetched: jobsBgJobs.length, new: jobsBgUpsert.newCount, errors: jobsBgUpsert.errorCount, deleted: 0 });
  } catch (err) {
    results.push({ source: 'jobs_bg', fetched: 0, new: 0, errors: 1, deleted: 0 });
  }

  // Safety-net: catch any that slipped through
  await classifyUnclassifiedJobs(500);

  const deleted = await cleanupOldJobs();
  const truncated = await truncateOldDescriptions();
  if (results.length > 0) results[0].deleted = deleted;
  void truncated;
  return results;
}
