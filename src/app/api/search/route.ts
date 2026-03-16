import { NextRequest, NextResponse } from 'next/server';
import { findMatches } from '@/lib/matching/engine';
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

    const token = request.headers.get('x-restore-token');
    await validateRestoreToken(profile_id, token);

    // Parse query parameters for sorting and filtering
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || undefined;
    const salaryMinParam = searchParams.get('salary_min');
    const salaryMaxParam = searchParams.get('salary_max');
    const postedWithinParam = searchParams.get('posted_within');

    const salaryMin = salaryMinParam ? parseInt(salaryMinParam, 10) : undefined;
    const salaryMax = salaryMaxParam ? parseInt(salaryMaxParam, 10) : undefined;
    const postedWithin = postedWithinParam ? parseInt(postedWithinParam, 10) : undefined;

    const result = await findMatches(profile_id, {
      sort,
      salaryMin,
      salaryMax,
      postedWithin,
    });
    const searchedAt = new Date().toISOString();

    return NextResponse.json({
      data: {
        results: result.results,
        total: result.total,
        search_id: result.search_id,
      },
      meta: {
        threshold: 5,
        max_score: 8,
        searched_at: searchedAt,
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
