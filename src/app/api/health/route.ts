import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  let dbStatus = 'error';

  try {
    const { db } = await import('@/lib/db');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  // Service configuration status — presence only, no secret values
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing';
  const stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing';
  const resend = process.env.RESEND_API_KEY ? 'configured' : 'missing';

  return NextResponse.json({
    status: 'ok',
    db: dbStatus,
    supabase,
    stripe,
    resend,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
