import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/ingestion/ingest';
import { classifyUnclassifiedJobs } from '@/lib/llm/batch-classify';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const incomingSecret = request.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional ?classify=true to run classification only (backlog clearing — up to 500/call)
  const classifyOnly = request.nextUrl.searchParams.get('classify') === 'true';

  try {
    if (classifyOnly) {
      const classified = await classifyUnclassifiedJobs(500);
      return NextResponse.json({ classified });
    }

    // Full pipeline: ingest all sources (each source classifies its own new jobs immediately)
    const ingested = await ingestAllSources();
    return NextResponse.json({ ingested });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[pipeline] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
