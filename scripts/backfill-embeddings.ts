/**
 * Backfill embeddings for jobs where embedding IS NULL
 * Uses Jina AI (768 dims) to generate embeddings
 * Runs in batches of 50 to avoid token limits and timeouts
 * 
 * Usage: npx tsx scripts/backfill-embeddings.ts [--limit 100]
 */

import { db } from '@/lib/db/index';
import { jobs } from '@/lib/db/schema';
import { sql, isNull } from 'drizzle-orm';
import { buildJobEmbeddingText, embedBatch } from '@/lib/embedding/embed';

const BATCH_SIZE = 50;
const JINA_API_KEY = process.env.JINA_API_KEY;

if (!JINA_API_KEY) {
  console.error('ERROR: JINA_API_KEY environment variable is required');
  process.exit(1);
}

async function backfillEmbeddings() {
  let totalProcessed = 0;
  let totalEmbedded = 0;
  let totalFailed = 0;

  try {
    while (true) {
      // Fetch batch of jobs with NULL embeddings
      const batch = await db
        .select()
        .from(jobs)
        .where(isNull(jobs.embedding))
        .limit(BATCH_SIZE);

      if (batch.length === 0) {
        console.log(`✓ All jobs have embeddings (total processed: ${totalProcessed})`);
        break;
      }

      console.log(`Processing batch: ${batch.length} jobs...`);

      // Build embedding texts
      const embeddingTexts = batch.map(job => buildJobEmbeddingText(job));

      try {
        // Call Jina API to generate embeddings for the batch
        const embeddings = await embedBatch(embeddingTexts);

        // Update each job with its embedding
        for (let i = 0; i < batch.length; i++) {
          const job = batch[i];
          const embedding = embeddings[i];

          if (embedding && embedding.length === 768) {
            await db
              .update(jobs)
              .set({ embedding })
              .where(sql`${jobs.id} = ${job.id}`);

            totalEmbedded++;
          } else {
            console.warn(`⚠ Invalid embedding for job ${job.id}: length ${embedding?.length || 0}`);
            totalFailed++;
          }
        }

        totalProcessed += batch.length;
        console.log(
          `✓ Batch complete: ${totalEmbedded}/${totalProcessed} embedded, ${totalFailed} failed`,
        );

        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (batchError) {
        console.error(`✗ Batch processing failed:`, batchError);
        totalFailed += batch.length;
        totalProcessed += batch.length;
      }
    }

    console.log('\n=== Backfill Summary ===');
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Successfully embedded: ${totalEmbedded}`);
    console.log(`Failed: ${totalFailed}`);

    if (totalEmbedded > 0) {
      console.log(`✓ Backfill complete`);
    } else {
      console.log(`⚠ No embeddings were created`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during backfill:', error);
    process.exit(1);
  }
}

backfillEmbeddings();
