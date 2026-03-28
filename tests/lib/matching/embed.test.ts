/**
 * Unit tests for the embedding helper functions.
 * All OpenAI fetch calls are mocked — no real API calls are made.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embedText, embedBatch } from '@/lib/embedding/embed';

// ── Helpers ───────────────────────────────────────────────────────────────────
const DUMMY_VECTOR_768 = new Array(768).fill(0).map((_, i) => i / 768);

function mockFetchOk(embeddings: number[][]) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: embeddings.map((embedding, index) => ({ index, embedding })),
    }),
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  process.env.JINA_API_KEY = 'test-key-for-matching-embed';
});

// ── embedText ─────────────────────────────────────────────────────────────────
describe('embedText', () => {
  it('returns an array of 768 numbers', async () => {
    vi.stubGlobal('fetch', mockFetchOk([DUMMY_VECTOR_768]));

    const result = await embedText('Software Engineer with 5 years of TypeScript experience');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(768);
    result.forEach(n => expect(typeof n).toBe('number'));
  });

  it('handles gracefully — throws typed error on empty string', async () => {
    await expect(embedText('')).rejects.toThrow('Cannot embed empty text');
    await expect(embedText('   ')).rejects.toThrow('Cannot embed empty text');
  });
});

// ── embedBatch ────────────────────────────────────────────────────────────────
describe('embedBatch', () => {
  it('returns an array of arrays, length matches input', async () => {
    const vectors = [DUMMY_VECTOR_768, DUMMY_VECTOR_768.map(x => x * 0.5)];
    vi.stubGlobal('fetch', mockFetchOk(vectors));

    const result = await embedBatch(['Data Scientist Python ML', 'Backend Engineer Node.js']);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    result.forEach(vec => {
      expect(Array.isArray(vec)).toBe(true);
      expect(vec).toHaveLength(768);
    });
  });

  it('returns empty array for empty input without calling API', async () => {
    const result = await embedBatch([]);
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws typed error when batch contains empty string', async () => {
    await expect(embedBatch(['valid text', ''])).rejects.toThrow('empty text');
    await expect(embedBatch(['', 'valid'])).rejects.toThrow('empty text');
  });

  it('throws when batch exceeds 100 items', async () => {
    const oversized = new Array(101).fill('some text');
    await expect(embedBatch(oversized)).rejects.toThrow('Batch size exceeds limit');
  });
});
