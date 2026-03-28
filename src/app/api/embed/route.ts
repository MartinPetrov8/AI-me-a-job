import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { embedText, buildJobEmbeddingText, buildProfileEmbeddingText } from '@/lib/embedding/embed';

export const runtime = 'nodejs';

function validateCronSecret(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!expectedSecret) return false;
  return cronSecret === expectedSecret;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { profile_id } = body;

  if (!profile_id) {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profile_id)).limit(1);

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const embeddingText = buildProfileEmbeddingText(profile);
  const embedding = await embedText(embeddingText);

  await db.update(profiles)
    .set({ embedding })
    .where(eq(profiles.id, profile_id));

  return NextResponse.json({ embedded: true, dimensions: 768 });
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job_id = searchParams.get('job_id');

  if (!job_id) {
    return NextResponse.json({ error: 'job_id query param is required' }, { status: 400 });
  }

  const [job] = await db.select().from(jobs).where(eq(jobs.id, job_id)).limit(1);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const embeddingText = buildJobEmbeddingText(job);
  const embedding = await embedText(embeddingText);

  await db.update(jobs)
    .set({ embedding })
    .where(eq(jobs.id, job_id));

  return NextResponse.json({ embedded: true, dimensions: 768 });
}
