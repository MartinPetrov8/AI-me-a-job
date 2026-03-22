/**
 * Incremental embedding batch route — runs daily via Vercel cron.
 * Embeds up to 500 jobs ingested in the last 24h that have no embedding.
 *
 * GET /api/embed/batch
 * Protected by CRON_SECRET header (Vercel cron passes it automatically when configured).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { embedBatch, buildJobEmbeddingText } from '@/lib/embedding/embed';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes — Vercel Pro limit

const BATCH_SIZE = 100;
const MAX_PER_RUN = 500;
const BATCH_DELAY_MS = 500;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('x-cron-secret') === secret;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

  // Fetch jobs ingested in last 24h without embeddings
  const pendingJobs = await db.execute(
    sql`
      SELECT id, title, company, location, description_raw
      FROM jobs
      WHERE embedding IS NULL
        AND classified_at IS NOT NULL
        AND ingested_at >= ${cutoff}
      ORDER BY ingested_at DESC
      LIMIT ${MAX_PER_RUN}
    `
  ) as any[];

  if (pendingJobs.length === 0) {
    return NextResponse.json({ embedded: 0, failed: 0, message: 'No pending jobs' });
  }

  let embedded = 0;
  let failed = 0;

  // Process in batches of 100 (OpenAI limit)
  for (let i = 0; i < pendingJobs.length; i += BATCH_SIZE) {
    const batch = pendingJobs.slice(i, i + BATCH_SIZE);

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

      for (let j = 0; j < batch.length; j++) {
        try {
          await db.execute(
            sql`UPDATE jobs SET embedding = ${JSON.stringify(embeddings[j])}::vector WHERE id = ${batch[j].id}`
          );
          embedded++;
        } catch (updateErr) {
          failed++;
        }
      }
    } catch (batchErr) {
      failed += batch.length;
    }

    // Rate-limit between batches
    if (i + BATCH_SIZE < pendingJobs.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return NextResponse.json({
    embedded,
    failed,
    total: pendingJobs.length,
  });
}
