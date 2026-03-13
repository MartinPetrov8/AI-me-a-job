import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import {
  YEARS_EXPERIENCE,
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  SPHERES_OF_EXPERTISE,
  SENIORITY_LEVELS,
  INDUSTRIES,
} from '@/lib/criteria';
import { z } from 'zod';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json(
      { error: 'user_id parameter is required' },
      { status: 400 }
    );
  }

  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        profile_id: profile.id,
        criteria: {
          years_experience: profile.yearsExperience,
          education_level: profile.educationLevel,
          field_of_study: profile.fieldOfStudy,
          sphere_of_expertise: profile.sphereOfExpertise,
          seniority_level: profile.seniorityLevel,
          industry: profile.industry,
          languages: profile.languages,
          key_skills: profile.keySkills,
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_id, ...criteriaFields } = body;

    if (!profile_id) {
      return NextResponse.json(
        { error: 'profile_id is required' },
        { status: 400 }
      );
    }

    const updateSchema = z.object({
      yearsExperience: z.enum(YEARS_EXPERIENCE).optional(),
      educationLevel: z.enum(EDUCATION_LEVELS).optional(),
      fieldOfStudy: z.enum(FIELDS_OF_STUDY).optional(),
      sphereOfExpertise: z.enum(SPHERES_OF_EXPERTISE).optional(),
      seniorityLevel: z.enum(SENIORITY_LEVELS).optional(),
      industry: z.enum(INDUSTRIES).optional(),
      languages: z.array(z.string()).optional(),
      keySkills: z.array(z.string()).optional(),
    });

    const validated = updateSchema.parse(criteriaFields);

    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile_id))
      .returning();

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        profile_id: updatedProfile.id,
        criteria: {
          years_experience: updatedProfile.yearsExperience,
          education_level: updatedProfile.educationLevel,
          field_of_study: updatedProfile.fieldOfStudy,
          sphere_of_expertise: updatedProfile.sphereOfExpertise,
          seniority_level: updatedProfile.seniorityLevel,
          industry: updatedProfile.industry,
          languages: updatedProfile.languages,
          key_skills: updatedProfile.keySkills,
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid criteria values', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
