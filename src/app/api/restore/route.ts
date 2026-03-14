import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

const restoreSchema = z.object({
  email: z.string().email(),
  restore_token: z.string().min(1),
});

const NOT_FOUND_RESPONSE = NextResponse.json(
  { errors: [{ code: 'NOT_FOUND', message: 'No profile found' }] },
  { status: 404 }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = restoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.issues.map((e: z.ZodIssue) => ({ code: 'VALIDATION_ERROR', message: e.message })) },
        { status: 400 }
      );
    }

    const { email, restore_token } = parsed.data;

    // Look up user — same 404 for wrong email OR wrong token (no enumeration)
    const user = await db
      .select({ id: users.id, restoreToken: users.restoreToken })
      .from(users)
      .where(and(eq(users.email, email), eq(users.restoreToken, restore_token)))
      .limit(1);

    if (user.length === 0) {
      return NOT_FOUND_RESPONSE;
    }

    const userId = user[0].id;
    // NOTE: restore_token is long-lived — do NOT invalidate here.
    // It is used for subsequent auth on /api/search and /api/preferences.

    // Get the profile
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return NOT_FOUND_RESPONSE;
    }

    const p = profile[0];

    return NextResponse.json({
      data: {
        profile_id: p.id,
        restore_token: user[0].restoreToken,
        profile: {
          id: p.id,
          userId: p.userId,
          cvFilename: p.cvFilename,
          yearsExperience: p.yearsExperience,
          educationLevel: p.educationLevel,
          fieldOfStudy: p.fieldOfStudy,
          sphereOfExpertise: p.sphereOfExpertise,
          seniorityLevel: p.seniorityLevel,
          industry: p.industry,
          languages: p.languages,
          keySkills: p.keySkills,
        },
      },
    });
  } catch (error) {
    console.error('[restore] error:', error);
    return NextResponse.json(
      { errors: [{ code: 'INTERNAL_ERROR', message: 'Internal server error' }] },
      { status: 500 }
    );
  }
}
