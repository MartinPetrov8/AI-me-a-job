import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { sql, gt } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await db
      .select({
        totalJobs: sql<number>`count(*)::int`,
        countries: sql<number>`count(distinct ${jobs.country})::int`,
        sources: sql<number>`count(distinct ${jobs.source})::int`,
        lastUpdated: sql<Date | null>`max(${jobs.ingestedAt})`,
      })
      .from(jobs)
      .where(gt(jobs.postedAt, thirtyDaysAgo));

    const stats = result[0] || { totalJobs: 0, countries: 0, sources: 0, lastUpdated: null };

    return NextResponse.json(
      {
        total_jobs: stats.totalJobs,
        countries: stats.countries,
        sources: stats.sources,
        last_updated: stats.lastUpdated?.toISOString() ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { errors: [{ code: 'STATS_FETCH_ERROR', message: 'Failed to fetch stats' }] },
      { status: 500 }
    );
  }
}
