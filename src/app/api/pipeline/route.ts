import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/ingestion/ingest';
import { classifyUnclassifiedJobs } from '@/lib/llm/batch-classify';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Protect with CRON_SECRET header
  const cronSecret = process.env.CRON_SECRET;
  const incomingSecret = request.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[pipeline] Starting ingestion...');
    const ingested = await ingestAllSources();
    console.log('[pipeline] Ingestion complete. Starting classification...');

    const classified = await classifyUnclassifiedJobs(100);
    console.log('[pipeline] Classification complete.');

    return NextResponse.json({ ingested, classified });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[pipeline] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
