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

  // Service configuration status — counts only, no service names (prevents stack enumeration)
  const configuredServices = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.STRIPE_SECRET_KEY,
    process.env.RESEND_API_KEY,
  ].filter(Boolean).length;
  const totalServices = 3;

  return NextResponse.json({
    status: 'ok',
    db: dbStatus,
    services: configuredServices,
    servicesTotal: totalServices,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
