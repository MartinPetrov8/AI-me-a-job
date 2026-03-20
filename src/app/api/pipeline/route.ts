import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources, ingestAdzuna, ingestDevBg, ingestJobsBg, ingestJooble, ingestRemoteOk, ingestWeWorkRemotely, ingestNoFluffJobs } from '@/lib/ingestion/ingest';
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

    // Support ?source= param for per-source cron calls (Vercel 300s timeout)
    const source = request.nextUrl.searchParams.get('source');
    const sourceMap: Record<string, () => Promise<import('@/lib/ingestion/types').IngestionResult>> = {
      adzuna: ingestAdzuna,
      devbg: ingestDevBg,
      jobsbg: ingestJobsBg,
      jooble: ingestJooble,
      remoteok: ingestRemoteOk,
      weworkremotely: ingestWeWorkRemotely,
      nofluffjobs: ingestNoFluffJobs,
    };

    if (source && sourceMap[source]) {
      const result = await sourceMap[source]();
      return NextResponse.json({ ingested: [result] });
    }

    // No source param = run all sources
    const ingested = await ingestAllSources();
    return NextResponse.json({ ingested });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
