import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources, ingestAdzuna, ingestDevBg, ingestJobsBg } from '@/lib/ingestion/ingest';
import { classifyUnclassifiedJobs } from '@/lib/llm/batch-classify';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { sql, isNull, isNotNull } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const incomingSecret = request.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [totalJobs, classifiedJobs, unclassifiedJobs, jobsBySource] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(jobs),
    db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(isNotNull(jobs.classifiedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(isNull(jobs.classifiedAt)),
    db.select({
      source: jobs.source,
      total: sql<number>`count(*)::int`,
      classified: sql<number>`count(*) filter (where classified_at is not null)::int`,
    })
      .from(jobs)
      .groupBy(jobs.source),
  ]);

  return NextResponse.json({
    total: totalJobs[0]?.count ?? 0,
    classified: classifiedJobs[0]?.count ?? 0,
    unclassified: unclassifiedJobs[0]?.count ?? 0,
    by_source: jobsBySource,
  });
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const incomingSecret = request.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const classifyOnly = request.nextUrl.searchParams.get('classify') === 'true';
  const sourceParam = request.nextUrl.searchParams.get('source');

  try {
    if (classifyOnly) {
      const batchResult = await classifyUnclassifiedJobs(1000);
      
      const [remainingCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(jobs)
        .where(isNull(jobs.classifiedAt));

      return NextResponse.json({
        classified: {
          total: batchResult.total,
          success: batchResult.classified,
          failed: batchResult.failed,
          remaining: remainingCount?.count ?? 0,
        },
      });
    }

    let ingested;
    if (sourceParam === 'adzuna') {
      const result = await ingestAdzuna();
      ingested = [result];
    } else if (sourceParam === 'devbg') {
      const result = await ingestDevBg();
      ingested = [result];
    } else if (sourceParam === 'jobsbg') {
      const result = await ingestJobsBg();
      ingested = [result];
    } else {
      ingested = await ingestAllSources();
    }

    return NextResponse.json({ ingested });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
