import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/health/embeddings/route';

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe('GET /api/health/embeddings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns embedding coverage stats for jobs and profiles', async () => {
    const { db } = await import('@/lib/db');
    
    (db.execute as any)
      .mockResolvedValueOnce([{ total: 1000, embedded: 650 }])
      .mockResolvedValueOnce([{ total: 50, embedded: 45 }]);

    const request = new Request('http://localhost:3000/api/health/embeddings', {
      method: 'GET',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      total_jobs: 1000,
      embedded_jobs: 650,
      coverage_pct: 65,
      total_profiles: 50,
      embedded_profiles: 45,
    });
  });

  it('calculates coverage_pct correctly', async () => {
    const { db } = await import('@/lib/db');
    
    (db.execute as any)
      .mockResolvedValueOnce([{ total: 100, embedded: 33 }])
      .mockResolvedValueOnce([{ total: 10, embedded: 8 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.coverage_pct).toBe(33);
  });

  it('handles zero jobs gracefully', async () => {
    const { db } = await import('@/lib/db');
    
    (db.execute as any)
      .mockResolvedValueOnce([{ total: 0, embedded: 0 }])
      .mockResolvedValueOnce([{ total: 5, embedded: 3 }]);

    const response = await GET();
    const data = await response.json();

    expect(data.coverage_pct).toBe(0);
    expect(data.total_jobs).toBe(0);
    expect(data.embedded_jobs).toBe(0);
  });

  it('handles database query failure', async () => {
    const { db } = await import('@/lib/db');
    
    (db.execute as any).mockRejectedValueOnce(new Error('Connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch embedding stats');
    expect(data.detail).toBe('Connection failed');
  });

  it('handles undefined values from database', async () => {
    const { db } = await import('@/lib/db');
    
    (db.execute as any)
      .mockResolvedValueOnce([{ total: null, embedded: null }])
      .mockResolvedValueOnce([{ total: undefined, embedded: undefined }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total_jobs).toBe(0);
    expect(data.embedded_jobs).toBe(0);
    expect(data.coverage_pct).toBe(0);
    expect(data.total_profiles).toBe(0);
    expect(data.embedded_profiles).toBe(0);
  });
});
