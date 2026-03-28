import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  embedText,
  embedBatch,
  buildProfileEmbeddingText,
  buildJobEmbeddingText,
} from './embed';

// ── Helpers ───────────────────────────────────────────────────────────────────
function mockFetchOk(embeddings: number[][]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: embeddings.map((embedding, index) => ({ index, embedding })),
    }),
  });
}

function mockFetchError(status: number, body: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: async () => body,
  });
}

const DUMMY_VECTOR = new Array(768).fill(0).map((_, i) => i / 768);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  process.env.JINA_API_KEY = 'test-key-123';
});

// ── embedText ─────────────────────────────────────────────────────────────────
describe('embedText', () => {
  it('calls the Jina embeddings endpoint with correct body', async () => {
    vi.stubGlobal('fetch', mockFetchOk([DUMMY_VECTOR]));

    await embedText('Machine Learning Engineer with 5 years experience');

    const [url, opts] = (global.fetch as any).mock.calls[0];
    expect(url).toBe('https://api.jina.ai/v1/embeddings');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('jina-embeddings-v3');
    expect(body.input).toBe('Machine Learning Engineer with 5 years experience');
  });

  it('returns a 768-dimensional vector', async () => {
    vi.stubGlobal('fetch', mockFetchOk([DUMMY_VECTOR]));
    const result = await embedText('some text');
    expect(result).toHaveLength(768);
    expect(result[0]).toBeCloseTo(0);
  });

  it('sends Authorization header with API key', async () => {
    vi.stubGlobal('fetch', mockFetchOk([DUMMY_VECTOR]));
    await embedText('test');
    const opts = (global.fetch as any).mock.calls[0][1];
    expect(opts.headers['Authorization']).toBe('Bearer test-key-123');
  });

  it('throws on empty text', async () => {
    await expect(embedText('')).rejects.toThrow('Cannot embed empty text');
    await expect(embedText('   ')).rejects.toThrow('Cannot embed empty text');
  });

  it('throws on API error response', async () => {
    vi.stubGlobal('fetch', mockFetchError(401, '{"error":"Invalid API key"}'));
    await expect(embedText('test')).rejects.toThrow('Jina embeddings API error 401');
  });

  it('throws when JINA_API_KEY is not set', async () => {
    delete process.env.JINA_API_KEY;
    await expect(embedText('test')).rejects.toThrow('JINA_API_KEY');
  });
});

// ── embedBatch ────────────────────────────────────────────────────────────────
describe('embedBatch', () => {
  it('returns empty array for empty input', async () => {
    const result = await embedBatch([]);
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns one embedding per input text', async () => {
    const vectors = [DUMMY_VECTOR, DUMMY_VECTOR.map(x => x * 2)];
    vi.stubGlobal('fetch', mockFetchOk(vectors));
    const result = await embedBatch(['text one', 'text two']);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(768);
    expect(result[1]).toHaveLength(768);
  });

  it('preserves order of embeddings by index', async () => {
    // API returns in random order — should be sorted by index
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { index: 1, embedding: [0.2, 0.2] },
          { index: 0, embedding: [0.1, 0.1] },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await embedBatch(['first', 'second']);
    expect(result[0][0]).toBeCloseTo(0.1);
    expect(result[1][0]).toBeCloseTo(0.2);
  });

  it('throws if batch exceeds 100 items', async () => {
    const texts = new Array(101).fill('text');
    await expect(embedBatch(texts)).rejects.toThrow('Batch size exceeds limit');
  });

  it('throws if batch contains empty text', async () => {
    await expect(embedBatch(['valid', ''])).rejects.toThrow('empty text');
  });
});

// ── buildProfileEmbeddingText ─────────────────────────────────────────────────
describe('buildProfileEmbeddingText', () => {
  it('joins all non-null fields with spaces', () => {
    const text = buildProfileEmbeddingText({
      titleInferred: 'Data Scientist',
      sphereOfExpertise: 'Data Science',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      keySkills: ['Python', 'ML', 'SQL'],
      yearsExperience: '5-9',
      prefLocation: 'Berlin',
    });
    expect(text).toBe('Data Scientist Data Science Senior Technology Python, ML, SQL 5-9 Berlin');
  });

  it('skips null and undefined fields', () => {
    const text = buildProfileEmbeddingText({
      sphereOfExpertise: 'Engineering',
      seniorityLevel: null,
      industry: 'Technology',
      keySkills: null,
      yearsExperience: '2-4',
      prefLocation: undefined,
    });
    expect(text).toBe('Engineering Technology 2-4');
  });

  it('returns empty string when all fields are null', () => {
    const text = buildProfileEmbeddingText({});
    expect(text).toBe('');
  });
});

// ── buildJobEmbeddingText ─────────────────────────────────────────────────────
describe('buildJobEmbeddingText', () => {
  it('joins all fields with spaces', () => {
    const text = buildJobEmbeddingText({
      title: 'Backend Engineer',
      company: 'TechCorp',
      location: 'Berlin',
      descriptionRaw: 'We are looking for a backend engineer...',
    });
    expect(text).toContain('Backend Engineer');
    expect(text).toContain('TechCorp');
    expect(text).toContain('Berlin');
  });

  it('truncates description to 8000 chars', () => {
    const longDesc = 'x'.repeat(10000);
    const text = buildJobEmbeddingText({
      title: 'Dev',
      company: null,
      location: null,
      descriptionRaw: longDesc,
    });
    expect(text.length).toBeLessThanOrEqual(8004); // "Dev " + 8000
  });

  it('skips null fields', () => {
    const text = buildJobEmbeddingText({ title: 'Dev', company: null, location: null, descriptionRaw: null });
    expect(text).toBe('Dev');
  });
});
