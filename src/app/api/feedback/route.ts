import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';

export const runtime = 'nodejs';

const FeedbackSchema = z.object({
  search_result_id: z.string().uuid(),
  useful: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = FeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.issues.map(e => ({ code: 'VALIDATION_ERROR', message: e.message, path: e.path })) },
        { status: 400 }
      );
    }

    await db.insert(feedback).values({
      searchResultId: parsed.data.search_result_id,
      useful: parsed.data.useful,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { errors: [{ code: 'FEEDBACK_INSERT_ERROR', message: 'Failed to store feedback' }] },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { errors: [{ code: 'METHOD_NOT_ALLOWED', message: 'GET not allowed on this endpoint' }] },
    { status: 405 }
  );
}
