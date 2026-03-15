import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources, ingestSource } from '@/lib/ingestion/ingest';
import { classifyUnclassifiedJobs } from '@/lib/llm/batch-classify';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const incomingSecret = request.headers.get('x-cron-secret');

  if (!cronSecret || incomingSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Optional ?source= param to run a single source (chunked mode)
  // Sources: adzuna-incremental (daily, new jobs only) | adzuna (weekly full) | jooble (weekly max) | devbg | jobsbg
  const source = request.nextUrl.searchParams.get('source');
  // Optional ?classify=true to run classification only
  const classifyOnly = request.nextUrl.searchParams.get('classify') === 'true';

  try {
    if (classifyOnly) {
      const classified = await classifyUnclassifiedJobs(100);
      return NextResponse.json({ classified });
    }

    if (source) {
      const ingested = await ingestSource(source);
      return NextResponse.json({ ingested });
    }

    // Full pipeline (original behaviour)
    const ingested = await ingestAllSources();
    const classified = await classifyUnclassifiedJobs(100);
    return NextResponse.json({ ingested, classified });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[pipeline] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
