import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { preferencesInputSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { authenticateRequest } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    if (!profileId || typeof profileId !== 'string') {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
    }

    await authenticateRequest(request, profileId);

    const [profile] = await db
      .select({
        prefLocation: profiles.prefLocation,
        prefWorkMode: profiles.prefWorkMode,
        prefEmploymentType: profiles.prefEmploymentType,
        prefSalaryMin: profiles.prefSalaryMin,
        prefSalaryMax: profiles.prefSalaryMax,
        prefSalaryCurrency: profiles.prefSalaryCurrency,
        prefRelocation: profiles.prefRelocation,
      })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        pref_location: profile.prefLocation,
        pref_work_mode: profile.prefWorkMode,
        pref_employment_type: profile.prefEmploymentType,
        pref_salary_min: profile.prefSalaryMin,
        pref_salary_max: profile.prefSalaryMax,
        pref_salary_currency: profile.prefSalaryCurrency,
        pref_relocation: profile.prefRelocation,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    await authenticateRequest(request, profileId);

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
    if (error instanceof Response) {
      return error;
    }
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
