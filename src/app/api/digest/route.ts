import { runWeeklyDigest } from '@/lib/email/digest-pipeline';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  // Auth: Bearer token check
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || !authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWeeklyDigest();
    return Response.json({ data: result }, { status: 200 });
  } catch (err: any) {
    console.error('[api/digest] Unexpected error:', err);
    return Response.json(
      { error: 'Internal server error', message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
