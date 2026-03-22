/**
 * Embedding API route — (re)compute embeddings for a single profile or job.
 *
 * POST /api/embed  { profile_id: string }  → compute/refresh profile embedding
 * GET  /api/embed?job_id=<uuid>            → compute/refresh job embedding
 *
 * Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { embedText, buildProfileEmbeddingText, buildJobEmbeddingText } from '@/lib/embedding/embed';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('x-cron-secret') === secret;
}

// ── POST /api/embed — embed a profile ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { profile_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { profile_id } = body;
  if (!profile_id) {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 });
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profile_id)).limit(1);
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const embeddingText = buildProfileEmbeddingText({
    titleInferred: profile.titleInferred,
    sphereOfExpertise: profile.sphereOfExpertise,
    seniorityLevel: profile.seniorityLevel,
    industry: profile.industry,
    keySkills: profile.keySkills,
    yearsExperience: profile.yearsExperience,
    prefLocation: profile.prefLocation,
  });

  const embedding = await embedText(embeddingText);
  await db.update(profiles).set({ embedding }).where(eq(profiles.id, profile_id));

  return NextResponse.json({ embedded: true, dimensions: embedding.length });
}

// ── GET /api/embed?job_id=<uuid> — embed a job ────────────────────────────────
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job_id = searchParams.get('job_id');

  if (!job_id) {
    return NextResponse.json({ error: 'job_id query parameter is required' }, { status: 400 });
  }

  const [job] = await db.select().from(jobs).where(eq(jobs.id, job_id)).limit(1);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const embeddingText = buildJobEmbeddingText({
    title: job.title,
    company: job.company,
    location: job.location,
    descriptionRaw: job.descriptionRaw,
  });

  const embedding = await embedText(embeddingText);
  await db.update(jobs).set({ embedding }).where(eq(jobs.id, job_id));

  return NextResponse.json({ embedded: true, dimensions: embedding.length });
}
