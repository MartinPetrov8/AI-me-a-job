/**
 * Backfill Embeddings Script
 * 
 * Compute embeddings for all existing jobs with null embedding vectors.
 * 
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts [--dry-run]
 * 
 * What it does:
 * - Queries jobs WHERE embedding IS NULL in batches of 100
 * - For each job: builds text from title + description_raw
 * - Calls OpenAI embeddings API via embedBatch()
 * - Updates jobs.embedding using Drizzle ORM
 * - Rate limiting: 500ms delay between batches
 * - Progress logging: 'Batch N/M complete (X jobs embedded)'
 * 
 * Flags:
 *   --dry-run    Count jobs needing embeddings but don't call API or update DB
 * 
 * Idempotency:
 * - Safe to re-run multiple times
 * - Already-embedded jobs are skipped (checks embedding IS NULL)
 * - If interrupted, re-running will pick up where it left off
 * 
 * Requirements:
 * - OPENAI_API_KEY must be set in .env
 * - Database connection must be configured (DATABASE_URL in .env)
 */

import { db } from '../src/lib/db';
import { jobs } from '../src/lib/db/schema';
import { isNull, count, eq } from 'drizzle-orm';
import { embedBatch, buildJobEmbeddingText } from '../src/lib/embedding/embed';

const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  try {
    const totalResult = await db.select({ count: count() }).from(jobs);
    const totalJobs = totalResult[0]?.count ?? 0;

    const nullEmbeddingResult = await db
      .select({ count: count() })
      .from(jobs)
      .where(isNull(jobs.embedding));
    const nullEmbeddingCount = nullEmbeddingResult[0]?.count ?? 0;

    process.stdout.write('Embedding Backfill Report:\n');
    process.stdout.write(`Total jobs in database: ${totalJobs}\n`);
    process.stdout.write(`Jobs without embeddings: ${nullEmbeddingCount}\n`);

    if (isDryRun) {
      process.stdout.write('\nDry run mode — no API calls or database updates will be performed.\n');
      process.exit(0);
    }

    if (nullEmbeddingCount === 0) {
      process.stdout.write('\nNo jobs need embeddings. Nothing to do.\n');
      process.exit(0);
    }

    process.stdout.write('\nStarting embedding generation...\n');

    let totalEmbedded = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    const totalBatches = Math.ceil(nullEmbeddingCount / BATCH_SIZE);
    let currentBatch = 0;

    while (true) {
      const jobsToEmbed = await db
        .select({
          id: jobs.id,
          title: jobs.title,
          company: jobs.company,
          location: jobs.location,
          descriptionRaw: jobs.descriptionRaw,
        })
        .from(jobs)
        .where(isNull(jobs.embedding))
        .limit(BATCH_SIZE);

      if (jobsToEmbed.length === 0) {
        break;
      }

      currentBatch++;

      try {
        const texts = jobsToEmbed.map(job => buildJobEmbeddingText(job));
        const embeddings = await embedBatch(texts);

        for (let i = 0; i < jobsToEmbed.length; i++) {
          const job = jobsToEmbed[i];
          const embedding = embeddings[i];

          try {
            await db
              .update(jobs)
              .set({ embedding: embedding })
              .where(eq(jobs.id, job.id));
            totalEmbedded++;
          } catch (updateError) {
            const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
            errors.push(`Job ${job.id}: Update failed - ${errorMsg}`);
            totalFailed++;
          }
        }

        process.stdout.write(`Batch ${currentBatch}/${totalBatches} complete (${totalEmbedded} jobs embedded)\n`);

        if (currentBatch < totalBatches) {
          await sleep(RATE_LIMIT_DELAY_MS);
        }
      } catch (batchError) {
        const errorMsg = batchError instanceof Error ? batchError.message : String(batchError);
        errors.push(`Batch ${currentBatch}: ${errorMsg}`);
        totalFailed += jobsToEmbed.length;
        process.stdout.write(`Batch ${currentBatch}/${totalBatches} failed - skipping ${jobsToEmbed.length} jobs\n`);

        if (currentBatch < totalBatches) {
          await sleep(RATE_LIMIT_DELAY_MS);
        }
      }
    }

    process.stdout.write(`\nDone. ${totalEmbedded} embedded, ${totalFailed} failed.\n`);

    if (errors.length > 0) {
      process.stdout.write('\nErrors:\n');
      errors.forEach(error => {
        process.stdout.write(`  - ${error}\n`);
      });
    }

    if (totalFailed > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Fatal error: ${errorMessage}\n`);
    process.exit(1);
  }
}

main();
