const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY environment variable is not set');
  return key;
}

/**
 * Generate an embedding vector for a single text input via OpenAI REST API.
 * No SDK dependency — plain fetch.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot embed empty text');
  }

  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * Max 100 inputs per batch (OpenAI limit).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 100) throw new Error('Batch size exceeds limit of 100 inputs');
  if (texts.some(t => !t || t.trim().length === 0)) throw new Error('Batch contains empty text');

  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings API error ${res.status}: ${err}`);
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
