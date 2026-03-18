import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { jobs } from '../src/lib/db/schema';
import { normalizeUrl, computeContentHash } from '../src/lib/ingestion/dedup';
import { eq, or, isNull } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function backfillHashes() {
  const jobsNeedingBackfill = await db
    .select()
    .from(jobs)
    .where(or(isNull(jobs.canonicalUrl), isNull(jobs.contentHash)));

  if (jobsNeedingBackfill.length === 0) {
    await sql.end();
    return;
  }

  const batchSize = 100;
  let updatedCount = 0;

  for (let i = 0; i < jobsNeedingBackfill.length; i += batchSize) {
    const batch = jobsNeedingBackfill.slice(i, i + batchSize);

    for (const job of batch) {
      const canonicalUrl = normalizeUrl(job.url);
      const contentHash = computeContentHash(
        job.title,
        job.company,
        job.country,
        job.postedAt
      );

      await db
        .update(jobs)
        .set({
          canonicalUrl,
          contentHash,
        })
        .where(eq(jobs.id, job.id));

      updatedCount++;
    }
  }

  await sql.end();
}

backfillHashes().catch((err) => {
  process.exit(1);
});
