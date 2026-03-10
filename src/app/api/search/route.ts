import { NextRequest, NextResponse } from 'next/server';
import { findMatches } from '@/lib/matching/engine';

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

    // TODO: Add proper session auth (NextAuth/Supabase Auth) before scaling
    // For MVP: profile_id is a non-guessable UUID, acceptable risk

    const result = await findMatches(profile_id);
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
