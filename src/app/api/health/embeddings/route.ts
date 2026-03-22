/**
 * Embedding health check endpoint.
 *
 * GET /api/health/embeddings
 * Returns coverage statistics for job and profile embeddings.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [jobStats] = await db.execute(
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(embedding)::int AS embedded
        FROM jobs
      `
    ) as any[];

    const [profileStats] = await db.execute(
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(embedding)::int AS embedded
        FROM profiles
      `
    ) as any[];

    const totalJobs = Number(jobStats?.total ?? 0);
    const embeddedJobs = Number(jobStats?.embedded ?? 0);
    const totalProfiles = Number(profileStats?.total ?? 0);
    const embeddedProfiles = Number(profileStats?.embedded ?? 0);
    
    const coveragePct = totalJobs > 0 ? Math.round((embeddedJobs / totalJobs) * 100) : 0;

    return NextResponse.json({
      total_jobs: totalJobs,
      embedded_jobs: embeddedJobs,
      coverage_pct: coveragePct,
      total_profiles: totalProfiles,
      embedded_profiles: embeddedProfiles,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch embedding stats', detail: message },
      { status: 500 }
    );
  }
}
