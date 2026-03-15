import { db } from '../db';
import { jobs } from '../db/schema';
import { and, lt, ne, or, isNull } from 'drizzle-orm';
import { fetchAllAdzunaJobs } from './adzuna';
import { fetchJoobleJobs } from './jooble';
import { fetchDevBgJobs } from './devbg';
import { fetchJobsBgJobs } from './jobsbg';
import { normalizeUrl, computeContentHash } from './dedup';
import { RawJobPosting, IngestionResult } from './types';

const JOOBLE_SEARCHES = [
  { keywords: 'software developer', location: '' },
  { keywords: 'data scientist', location: '' },
  { keywords: 'product manager', location: '' },
  { keywords: 'marketing manager', location: '' },
  { keywords: 'finance analyst', location: '' },
];

async function upsertJobs(postings: RawJobPosting[]): Promise<{ newCount: number; errorCount: number }> {
  let newCount = 0;
  let errorCount = 0;

  for (const posting of postings) {
    try {
      const canonicalUrl = normalizeUrl(posting.url);
      const contentHash = computeContentHash(
        posting.title,
        posting.company,
        posting.country,
        posting.posted_at,
      );

      await db
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
        });

      newCount++;
    } catch (err) {
      errorCount++;
      console.error(`[ingest] upsert error for ${posting.source}/${posting.external_id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { newCount, errorCount };
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
  console.log('[ingest] Fetching Adzuna jobs...');
  const adzunaJobs = await fetchAllAdzunaJobs();
  const adzunaUpsert = await upsertJobs(adzunaJobs);

  results.push({
    source: 'adzuna',
    fetched: adzunaJobs.length,
    new: adzunaUpsert.newCount,
    errors: adzunaUpsert.errorCount,
    deleted: 0, // cleanup runs once at the end
  });

  console.log(`[ingest] Adzuna: ${adzunaJobs.length} fetched, ${adzunaUpsert.newCount} upserted, ${adzunaUpsert.errorCount} errors`);

  // Jooble
  console.log('[ingest] Fetching Jooble jobs...');
  let allJoobleJobs: RawJobPosting[] = [];

  for (const search of JOOBLE_SEARCHES) {
    const jobBatch = await fetchJoobleJobs(search.keywords, search.location);
    allJoobleJobs.push(...jobBatch);
  }

  const joobleUpsert = await upsertJobs(allJoobleJobs);

  results.push({
    source: 'jooble',
    fetched: allJoobleJobs.length,
    new: joobleUpsert.newCount,
    errors: joobleUpsert.errorCount,
    deleted: 0, // cleanup runs once at the end
  });

  console.log(`[ingest] Jooble: ${allJoobleJobs.length} fetched, ${joobleUpsert.newCount} upserted, ${joobleUpsert.errorCount} errors`);

  // dev.bg
  try {
    const devBgJobs = await fetchDevBgJobs();
    const devBgUpsert = await upsertJobs(devBgJobs);
    results.push({
      source: 'dev_bg',
      fetched: devBgJobs.length,
      new: devBgUpsert.newCount,
      errors: devBgUpsert.errorCount,
      deleted: 0,
    });
  } catch (err) {
    results.push({ source: 'dev_bg', fetched: 0, new: 0, errors: 1, deleted: 0 });
  }

  // jobs.bg
  try {
    const jobsBgJobs = await fetchJobsBgJobs();
    const jobsBgUpsert = await upsertJobs(jobsBgJobs);
    results.push({
      source: 'jobs_bg',
      fetched: jobsBgJobs.length,
      new: jobsBgUpsert.newCount,
      errors: jobsBgUpsert.errorCount,
      deleted: 0,
    });
  } catch (err) {
    results.push({ source: 'jobs_bg', fetched: 0, new: 0, errors: 1, deleted: 0 });
  }

  // Cleanup runs ONCE after all sources are ingested (ISSUE-4 fix — prevents race condition)
  console.log('[ingest] Running post-ingestion cleanup...');
  const deleted = await cleanupOldJobs();
  const truncated = await truncateOldDescriptions();
  console.log(`[ingest] Cleanup: ${deleted} jobs deleted (>30d), ${truncated} descriptions truncated (>7d)`);

  // Attach cleanup totals to first result for reporting
  if (results.length > 0) {
    results[0].deleted = deleted;
  }

  return results;
}

/**
 * Ingest a single named source. Used by /api/pipeline?source=X for chunked runs.
 * Supported: "adzuna" | "jooble" | "devbg" | "jobsbg"
 */
export async function ingestSource(source: string): Promise<IngestionResult[]> {
  const results: IngestionResult[] = [];

  if (source === 'adzuna') {
    const jobs = await fetchAllAdzunaJobs();
    const r = await upsertJobs(jobs);
    results.push({ source: 'adzuna', fetched: jobs.length, new: r.newCount, errors: r.errorCount, deleted: 0 });
  } else if (source === 'jooble') {
    // Broad keyword matrix across EE + remote — 5 pages × 30 jobs per query = up to 150 each
    const JOOBLE_QUERIES: Array<{ keywords: string; location: string }> = [
      { keywords: 'software engineer', location: '' },
      { keywords: 'data scientist', location: '' },
      { keywords: 'product manager', location: '' },
      { keywords: 'devops engineer', location: '' },
      { keywords: 'data engineer', location: '' },
      { keywords: 'software developer', location: 'Bulgaria' },
      { keywords: 'data analyst', location: 'Bulgaria' },
      { keywords: 'software engineer', location: 'Bulgaria' },
      { keywords: 'software developer', location: 'Poland' },
      { keywords: 'software engineer', location: 'Poland' },
      { keywords: 'data scientist', location: 'Poland' },
      { keywords: 'software developer', location: 'Romania' },
      { keywords: 'software engineer', location: 'Romania' },
      { keywords: 'software engineer', location: 'Czech Republic' },
      { keywords: 'software developer', location: 'Czech Republic' },
    ];
    let total = 0;
    let newTotal = 0;
    let errorTotal = 0;
    for (const { keywords, location } of JOOBLE_QUERIES) {
      const jobsBatch = await fetchJoobleJobs(keywords, location);
      const r = await upsertJobs(jobsBatch);
      total += jobsBatch.length;
      newTotal += r.newCount;
      errorTotal += r.errorCount;
    }
    results.push({ source: 'jooble', fetched: total, new: newTotal, errors: errorTotal, deleted: 0 });
  } else if (source === 'devbg') {
    const jobs = await fetchDevBgJobs();
    const r = await upsertJobs(jobs);
    results.push({ source: 'dev_bg', fetched: jobs.length, new: r.newCount, errors: r.errorCount, deleted: 0 });
  } else if (source === 'jobsbg') {
    const jobs = await fetchJobsBgJobs();
    const r = await upsertJobs(jobs);
    results.push({ source: 'jobs_bg', fetched: jobs.length, new: r.newCount, errors: r.errorCount, deleted: 0 });
  } else {
    throw new Error(`Unknown source: ${source}. Valid: adzuna | jooble | devbg | jobsbg`);
  }

  return results;
}
