import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users, profiles } from '@/lib/db/schema';
import { eq, ne, and } from 'drizzle-orm';

const saveSchema = z.object({
  profile_id: z.string().uuid(),
  email: z.string().email(),
});

function generateRestoreToken(): string {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.issues.map((e: z.ZodIssue) => ({ code: 'VALIDATION_ERROR', message: e.message })) },
        { status: 400 }
      );
    }

    const { profile_id, email } = parsed.data;

    // Find the profile and its user
    const profile = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profile_id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { errors: [{ code: 'NOT_FOUND', message: 'Profile not found' }] },
        { status: 404 }
      );
    }

    const userId = profile[0].userId;

    // Check if email already exists on a DIFFERENT user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, userId)))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { errors: [{ code: 'CONFLICT', message: 'Email already registered' }] },
        { status: 409 }
      );
    }

    const restore_token = generateRestoreToken();

    await db
      .update(users)
      .set({ email, restoreToken: restore_token, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ data: { saved: true, restore_token } });
  } catch (error) {
    console.error('[save] error:', error);
    return NextResponse.json(
      { errors: [{ code: 'INTERNAL_ERROR', message: 'Internal server error' }] },
      { status: 500 }
    );
  }
}
