/**
 * Embedding health check endpoint.
 *
 * GET /api/health/embeddings
 * Returns coverage statistics for job and profile embeddings.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { db } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');

    const [jobStats] = await db.execute(
      sql`
        SELECT
          COUNT(*)::int AS total_jobs,
          COUNT(embedding)::int AS embedded_jobs
        FROM jobs
        WHERE classified_at IS NOT NULL
      `
    ) as any[];

    const [profileStats] = await db.execute(
      sql`
        SELECT COUNT(embedding)::int AS profiles_embedded
        FROM profiles
      `
    ) as any[];

    const totalJobs = Number(jobStats?.total_jobs ?? 0);
    const embeddedJobs = Number(jobStats?.embedded_jobs ?? 0);
    const profilesEmbedded = Number(profileStats?.profiles_embedded ?? 0);
    const coveragePct = totalJobs > 0 ? Math.round((embeddedJobs / totalJobs) * 100) : 0;

    return NextResponse.json({
      total_jobs: totalJobs,
      embedded: embeddedJobs,
      coverage_pct: coveragePct,
      profiles_embedded: profilesEmbedded,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch embedding stats', detail: message },
      { status: 500 }
    );
  }
}
