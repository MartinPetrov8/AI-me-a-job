/**
 * Backfill embeddings for all jobs that have no embedding yet.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts           # live run
 *   npx tsx scripts/backfill-embeddings.ts --dry-run # parse-only, no DB writes / API calls
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, isNull } from 'drizzle-orm';
import { jobs } from '../src/lib/db/schema';
import { embedBatch, buildJobEmbeddingText } from '../src/lib/embedding/embed';

const BATCH_SIZE = 100;
const BATCH_DELAY_MS = 500;
const MAX_JOBS_PER_RUN = 10_000; // safety ceiling

const isDryRun = process.argv.includes('--dry-run');

// ── DB bootstrap (separate from serverless client — no pgbouncer quirks) ───────
function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set');

  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return drizzle(client, { schema: { jobs } });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[backfill-embeddings] Starting${isDryRun ? ' (DRY RUN)' : ''}…`);

  if (isDryRun) {
    console.log('[backfill-embeddings] --dry-run flag detected — skipping DB queries and API calls.');
    console.log('[backfill-embeddings] Done. 0 embedded, 0 failed.');
    return;
  }

  const db = getDb();

  // Count total jobs needing embeddings
  const countResult = await db.execute(
    sql`SELECT COUNT(*) AS cnt FROM jobs WHERE embedding IS NULL AND classified_at IS NOT NULL`
  );
  const totalToEmbed = Number((countResult as any)[0]?.cnt ?? 0);
  const totalBatches = Math.ceil(Math.min(totalToEmbed, MAX_JOBS_PER_RUN) / BATCH_SIZE);

  console.log(`[backfill-embeddings] ${totalToEmbed} jobs need embeddings → ${totalBatches} batches of ${BATCH_SIZE}`);

  if (totalToEmbed === 0) {
    console.log('[backfill-embeddings] Nothing to do. Done.');
    process.exit(0);
  }

  let embedded = 0;
  let failed = 0;
  let batchNum = 0;
  let offset = 0;

  while (offset < Math.min(totalToEmbed, MAX_JOBS_PER_RUN)) {
    batchNum++;

    // Fetch next batch
    const batch = await db.execute(
      sql`
        SELECT id, title, company, location, description_raw
        FROM jobs
        WHERE embedding IS NULL AND classified_at IS NOT NULL
        ORDER BY ingested_at DESC
        LIMIT ${BATCH_SIZE}
        OFFSET ${offset}
      `
    ) as any[];

    if (batch.length === 0) break;

    // Build embedding texts
    const texts = batch.map((row: any) =>
      buildJobEmbeddingText({
        title: row.title,
        company: row.company,
        location: row.location,
        descriptionRaw: row.description_raw,
      })
    );

    try {
      const embeddings = await embedBatch(texts);

      // Update each job's embedding
      for (let i = 0; i < batch.length; i++) {
        try {
          await db.execute(
            sql`UPDATE jobs SET embedding = ${JSON.stringify(embeddings[i])}::vector WHERE id = ${batch[i].id}`
          );
          embedded++;
        } catch (updateErr) {
          console.error(`[backfill-embeddings] Failed to update job ${batch[i].id}:`, updateErr);
          failed++;
        }
      }

      console.log(`[backfill-embeddings] Batch ${batchNum}/${totalBatches} complete (${embedded} jobs embedded)`);
    } catch (batchErr) {
      console.error(`[backfill-embeddings] Batch ${batchNum} embed API call failed — skipping ${batch.length} jobs:`, batchErr);
      failed += batch.length;
    }

    offset += batch.length;

    // Rate-limit: 500ms delay between batches
    if (offset < Math.min(totalToEmbed, MAX_JOBS_PER_RUN)) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`[backfill-embeddings] Done. ${embedded} embedded, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[backfill-embeddings] Fatal error:', err);
  process.exit(1);
});
