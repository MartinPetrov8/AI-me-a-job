import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Run pending migrations on the production DB.
 * POST /api/health/migrate?token=<secret>
 * 
 * This is a one-time diagnostic endpoint — remove after migrations are applied.
 * Protected by a simple token check to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  // Simple protection — require the first 8 chars of OPENROUTER_API_KEY as token
  const token = request.nextUrl.searchParams.get('token');
  const expected = process.env.OPENROUTER_API_KEY?.substring(0, 8);
  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{ step: string; status: string; detail?: string }> = [];

  // Step 0: Check current schema state
  try {
    const columns = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);
    results.push({ step: '0_check_profiles_columns', status: 'OK', detail: JSON.stringify(columns) });
  } catch (e) {
    results.push({ step: '0_check_profiles_columns', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 1: Enable pgvector extension (required for embedding columns)
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    results.push({ step: '1_enable_pgvector', status: 'OK' });
  } catch (e) {
    results.push({ step: '1_enable_pgvector', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 2: Add title_inferred to profiles (if missing)
  try {
    await db.execute(sql`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "title_inferred" text`);
    results.push({ step: '2_add_title_inferred', status: 'OK' });
  } catch (e) {
    results.push({ step: '2_add_title_inferred', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 3: Add embedding to profiles (if missing)
  try {
    await db.execute(sql`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "embedding" vector(1536)`);
    results.push({ step: '3_add_profiles_embedding', status: 'OK' });
  } catch (e) {
    results.push({ step: '3_add_profiles_embedding', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 4: Add embedding to jobs (if missing)
  try {
    await db.execute(sql`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "embedding" vector(1536)`);
    results.push({ step: '4_add_jobs_embedding', status: 'OK' });
  } catch (e) {
    results.push({ step: '4_add_jobs_embedding', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 5: Add canonical_url and content_hash to jobs (if missing)
  try {
    await db.execute(sql`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "canonical_url" text`);
    await db.execute(sql`ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "content_hash" text`);
    results.push({ step: '5_add_jobs_dedup_columns', status: 'OK' });
  } catch (e) {
    results.push({ step: '5_add_jobs_dedup_columns', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 6: Create sessions table (if missing) — from Sprint K
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "session_token" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "expires_at" timestamp with time zone NOT NULL,
        CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
      )
    `);
    results.push({ step: '6_create_sessions_table', status: 'OK' });
  } catch (e) {
    results.push({ step: '6_create_sessions_table', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 7: Add sessions FK (if missing)
  try {
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    results.push({ step: '7_sessions_fk', status: 'OK' });
  } catch (e) {
    results.push({ step: '7_sessions_fk', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Step 8: Add indexes (if missing)
  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "jobs_canonical_url_idx" ON "jobs" USING btree ("canonical_url")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "jobs_content_hash_idx" ON "jobs" USING btree ("content_hash")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_sessions_token" ON "sessions" USING btree ("session_token")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions" USING btree ("user_id")`);
    results.push({ step: '8_add_indexes', status: 'OK' });
  } catch (e) {
    results.push({ step: '8_add_indexes', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  // Final: Check profiles columns again
  try {
    const columns = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);
    results.push({ step: '9_verify_profiles_columns', status: 'OK', detail: JSON.stringify(columns) });
  } catch (e) {
    results.push({ step: '9_verify_profiles_columns', status: 'FAILED', detail: e instanceof Error ? e.message : String(e) });
  }

  const allPassed = results.every(r => r.status === 'OK');
  return NextResponse.json({ results, allPassed });
}
