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

    // Parse sort + filter params from BOTH query string (sort) and request body (filters)
    // Sort comes via query param (?sort=posted_at) since UI appends it to the URL
    // Salary/date filters come from the Edit Filters panel via request body
    const { searchParams } = new URL(request.url);

    const VALID_SORT = ['score', 'posted_at', 'salary_max'] as const;
    type SortOption = typeof VALID_SORT[number];
    const sortParam = searchParams.get('sort');
    const sort: SortOption | undefined = VALID_SORT.includes(sortParam as SortOption)
      ? (sortParam as SortOption)
      : undefined;

    // Salary and date filters come from body (set by Edit Filters panel)
    const salaryMinRaw = body.salary_min;
    const salaryMaxRaw = body.salary_max;
    const postedWithinRaw = body.posted_within;

    const salaryMin = typeof salaryMinRaw === 'number' && !isNaN(salaryMinRaw) && salaryMinRaw > 0
      ? salaryMinRaw : undefined;
    const salaryMax = typeof salaryMaxRaw === 'number' && !isNaN(salaryMaxRaw) && salaryMaxRaw > 0
      ? salaryMaxRaw : undefined;
    const VALID_POSTED_WITHIN = [7, 30];
    const postedWithin = typeof postedWithinRaw === 'number' && VALID_POSTED_WITHIN.includes(postedWithinRaw)
      ? postedWithinRaw : undefined;

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
