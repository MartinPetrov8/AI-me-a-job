import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars (existence only, never values)
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'set' : 'MISSING';
  checks.LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'not set (default: openrouter)';
  checks.LLM_MODEL = process.env.LLM_MODEL ?? 'not set (default: qwen/qwen-2.5-72b-instruct)';
  checks.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ? `set (${process.env.OPENROUTER_API_KEY.substring(0, 8)}...)` : 'MISSING';
  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.substring(0, 8)}...)` : 'not set';
  checks.NODE_ENV = process.env.NODE_ENV ?? 'not set';

  // Test DB connection
  try {
    const { db } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.db_connection = 'OK';
  } catch (e) {
    checks.db_connection = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test OpenRouter reachability (no actual LLM call, just auth check)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(10000),
      });
      checks.openrouter_api = `${r.status} ${r.statusText}`;
    } catch (e) {
      checks.openrouter_api = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({ status: 'ok', checks, timestamp: new Date().toISOString() });
}
