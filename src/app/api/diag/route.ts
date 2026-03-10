export const runtime = 'nodejs';

export async function GET() {
  const results: Record<string, string> = {};
  
  try {
    const { db } = await import('@/lib/db');
    results.db = 'ok';
  } catch (e: any) {
    results.db = 'FAIL: ' + e.message;
  }

  try {
    await import('@/lib/cv-parser/extract-text');
    results.extractText = 'ok';
  } catch (e: any) {
    results.extractText = 'FAIL: ' + e.message;
  }

  try {
    await import('@/lib/llm/extract-cv');
    results.extractCv = 'ok';
  } catch (e: any) {
    results.extractCv = 'FAIL: ' + e.message;
  }

  results.DATABASE_URL = process.env.DATABASE_URL ? 'set (' + process.env.DATABASE_URL.substring(0, 40) + '...)' : 'MISSING';
  results.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ? 'set' : 'MISSING';

  return Response.json(results);
}
