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

    // Salary and date filters: accept from query string OR body (body takes precedence)
    // Query string: used by tests and direct API calls
    // Body: used by Edit Filters panel in UI
    const salaryMinRaw = body.salary_min ?? (searchParams.get('salary_min') ? Number(searchParams.get('salary_min')) : undefined);
    const salaryMaxRaw = body.salary_max ?? (searchParams.get('salary_max') ? Number(searchParams.get('salary_max')) : undefined);
    const postedWithinRaw = body.posted_within ?? (searchParams.get('posted_within') ? Number(searchParams.get('posted_within')) : undefined);

    const salaryMin = typeof salaryMinRaw === 'number' && !isNaN(salaryMinRaw) && salaryMinRaw > 0
      ? salaryMinRaw : undefined;
    const salaryMax = typeof salaryMaxRaw === 'number' && !isNaN(salaryMaxRaw) && salaryMaxRaw > 0
      ? salaryMaxRaw : undefined;
    const VALID_POSTED_WITHIN = [7, 14, 30];
    const postedWithin = typeof postedWithinRaw === 'number' && VALID_POSTED_WITHIN.includes(postedWithinRaw)
      ? postedWithinRaw : undefined;

    // Edit Filters panel overrides — location, work_mode, employment_type from request body
    // These override the stored profile preferences for this search only (not persisted)
    const locationOverride = typeof body.location === 'string' ? body.location.trim() : undefined;
    const VALID_WORK_MODES = ['remote', 'hybrid', 'onsite', 'Remote', 'Hybrid', 'On-site', ''];
    const workModeOverride = typeof body.work_mode === 'string' && VALID_WORK_MODES.includes(body.work_mode)
      ? body.work_mode : undefined;
    const VALID_EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'Full-time', 'Part-time', 'Contract', ''];
    const employmentTypeOverride = typeof body.employment_type === 'string' && VALID_EMPLOYMENT_TYPES.includes(body.employment_type)
      ? body.employment_type : undefined;

    const result = await findMatches(profile_id, {
      sort,
      salaryMin,
      salaryMax,
      postedWithin,
      locationOverride,
      workModeOverride,
      employmentTypeOverride,
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
        max_score: result.max_score,  // 8 base + 1 location when prefLocation is set
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
