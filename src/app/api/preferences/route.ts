import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { preferencesInputSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { verifyProfileOwnership } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract profile_id
    const { profileId, ...preferences } = body;
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'Missing profileId' },
        { status: 400 }
      );
    }

    // Verify ownership — prevent IDOR (ISSUE-1 fix)
    const auth = await verifyProfileOwnership(
      request.headers.get('authorization'),
      profileId
    );
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Validate preferences
    const validated = preferencesInputSchema.parse(preferences);

    // Update profile with preferences
    const updated = await db
      .update(profiles)
      .set({
        prefEmploymentType: validated.prefEmploymentType || null,
        prefLocation: validated.prefLocation || null,
        prefWorkMode: validated.prefWorkMode || null,
        prefRelocation: validated.prefRelocation ?? null,
        prefSalaryMin: validated.prefSalaryMin || null,
        prefSalaryMax: validated.prefSalaryMax || null,
        prefSalaryCurrency: validated.prefSalaryCurrency || null,
      })
      .where(eq(profiles.id, profileId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        profile_id: updated[0].id,
        updated: true,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
