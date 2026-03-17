import { NextRequest, NextResponse } from 'next/server';
import { findMatches } from '@/lib/matching/engine';
import { db } from '@/lib/db/index';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateRestoreToken } from '@/lib/auth/validate-restore-token';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id } = body;

    if (!profile_id || typeof profile_id !== 'string') {
      return NextResponse.json(
        { error: 'profile_id is required and must be a string' },
        { status: 400 }
      );
    }

    // TODO: Add proper session auth before scaling
    const token = request.headers.get('x-restore-token');
    await validateRestoreToken(profile_id, token);

    // Get profile to check last_search_at
    const profileResult = await db.select().from(profiles).where(eq(profiles.id, profile_id)).limit(1);
    if (profileResult.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profile = profileResult[0];
    const since = profile.lastSearchAt ? profile.lastSearchAt.toISOString() : new Date(0).toISOString();

    const result = await findMatches(profile_id, { delta: true });
    const searchedAt = new Date().toISOString();

    return NextResponse.json({
      data: {
        results: result.results,
        total: result.total,
        search_id: result.search_id,
      },
      meta: {
        threshold: 5,
        max_score: result.max_score,  // 8 base + 1 location when prefLocation is set
        searched_at: searchedAt,
        is_delta: true,
        since,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Response) {
      return error;
    }
    if (error instanceof Error && error.message === 'Profile not found') {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
