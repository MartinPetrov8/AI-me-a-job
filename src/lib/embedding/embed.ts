const EMBEDDING_MODEL = 'jina-embeddings-v3';
const EMBEDDING_DIMENSIONS = 768;
const JINA_EMBEDDINGS_URL = 'https://api.jina.ai/v1/embeddings';
const FETCH_TIMEOUT_MS = 20_000; // 20s — prevents hanging serverless functions

function getApiKey(): string {
  // Graceful degradation: return empty string if key not set
  // Allows running locally without Jina key for testing
  return process.env.JINA_API_KEY || '';
}

/**
 * Generate an embedding vector for a single text input via Jina AI REST API.
 * No SDK dependency — plain fetch.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('JINA_API_KEY environment variable is not set. Get one at https://jina.ai/api-dashboard/key-manager');
  }

  const res = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jina embeddings API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * Max 2048 tokens per request; typical job posting ~500 tokens, so ~4 documents max safely.
 * Use batch size of 4 to be conservative.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 100) throw new Error('Batch size exceeds limit of 100 inputs');
  if (texts.some(t => !t || t.trim().length === 0)) throw new Error('Batch contains empty text');

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('JINA_API_KEY environment variable is not set. Get one at https://jina.ai/api-dashboard/key-manager');
  }

  const res = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jina embeddings API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}

/**
 * Build embedding input text for a profile.
 */
export function buildProfileEmbeddingText(profile: {
  titleInferred?: string | null;
  sphereOfExpertise?: string | null;
  seniorityLevel?: string | null;
  industry?: string | null;
  keySkills?: string[] | null;
  yearsExperience?: string | null;
  prefLocation?: string | null;
}): string {
  return [
    profile.titleInferred,
    profile.sphereOfExpertise,
    profile.seniorityLevel,
    profile.industry,
    profile.keySkills?.join(', '),
    profile.yearsExperience,
    profile.prefLocation,
  ].filter(Boolean).join(' ').trim();
}

/**
 * Build embedding input text for a job.
 */
export function buildJobEmbeddingText(job: {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  descriptionRaw?: string | null;
}): string {
  return [
    job.title,
    job.company,
    job.location,
    job.descriptionRaw?.slice(0, 8000),
  ].filter(Boolean).join(' ').trim();
}
