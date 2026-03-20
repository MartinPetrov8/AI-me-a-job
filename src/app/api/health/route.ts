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

  return NextResponse.json({
    status: 'ok',
    db: dbStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
