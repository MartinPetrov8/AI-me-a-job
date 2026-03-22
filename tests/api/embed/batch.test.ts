import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/embed/batch/route';
import { db } from '@/lib/db';
import * as embed from '@/lib/embedding/embed';

vi.mock('@/lib/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/embedding/embed', () => ({
  embedBatch: vi.fn(),
  buildJobEmbeddingText: vi.fn(),
}));

describe('GET /api/embed/batch', () => {
  const validSecret = 'test-cron-secret';
  const fakeEmbedding = new Array(1536).fill(0.1);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = validSecret;
  });

  it('returns 401 when CRON_SECRET header is missing', async () => {
    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when CRON_SECRET header is invalid', async () => {
    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': 'wrong-secret' },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns success message when no pending jobs exist', async () => {
    vi.mocked(db.execute).mockResolvedValue([] as any);

    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ embedded: 0, failed: 0, message: 'No pending jobs' });
  });

  it('processes 250 jobs ingested in last 24h with null embeddings', async () => {
    const mockJobs = Array.from({ length: 250 }, (_, i) => ({
      id: `job-${i}`,
      title: `Backend Developer ${i}`,
      company: `Tech Corp ${i}`,
      location: 'Sofia, Bulgaria',
      description_raw: `Job description ${i}`,
    }));

    const executeMock = vi.fn();
    executeMock.mockResolvedValueOnce(mockJobs as any);
    
    for (let i = 0; i < 250; i++) {
      executeMock.mockResolvedValueOnce(undefined);
    }
    
    vi.mocked(db.execute).mockImplementation(executeMock);

    vi.mocked(embed.buildJobEmbeddingText).mockImplementation((job: any) =>
      `${job.title} ${job.company} ${job.location}`
    );

    vi.mocked(embed.embedBatch).mockResolvedValue(
      Array.from({ length: 100 }, () => fakeEmbedding)
    );

    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      embedded: 250,
      failed: 0,
      total: 250,
    });

    expect(embed.embedBatch).toHaveBeenCalledTimes(3);
    expect(executeMock).toHaveBeenCalledTimes(251);
  });

  it('handles batch embedding failures gracefully', async () => {
    const mockJobs = Array.from({ length: 150 }, (_, i) => ({
      id: `job-${i}`,
      title: `Backend Developer ${i}`,
      company: `Tech Corp ${i}`,
      location: 'Sofia, Bulgaria',
      description_raw: `Job description ${i}`,
    }));

    const executeMock = vi.fn();
    executeMock.mockResolvedValueOnce(mockJobs as any);
    
    for (let i = 0; i < 100; i++) {
      executeMock.mockResolvedValueOnce(undefined);
    }
    
    vi.mocked(db.execute).mockImplementation(executeMock);

    vi.mocked(embed.buildJobEmbeddingText).mockImplementation((job: any) =>
      `${job.title} ${job.company} ${job.location}`
    );

    vi.mocked(embed.embedBatch)
      .mockResolvedValueOnce(Array.from({ length: 100 }, () => fakeEmbedding))
      .mockRejectedValueOnce(new Error('OpenAI API rate limit'));

    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      embedded: 100,
      failed: 50,
      total: 150,
    });

    expect(embed.embedBatch).toHaveBeenCalledTimes(2);
    expect(executeMock).toHaveBeenCalledTimes(101);
  });

  it('processes jobs in batches of 100', async () => {
    const mockJobs = Array.from({ length: 250 }, (_, i) => ({
      id: `job-${i}`,
      title: `Backend Developer ${i}`,
      company: `Tech Corp ${i}`,
      location: 'Sofia, Bulgaria',
      description_raw: `Job description ${i}`,
    }));

    const executeMock = vi.fn();
    executeMock.mockResolvedValueOnce(mockJobs as any);
    
    for (let i = 0; i < 250; i++) {
      executeMock.mockResolvedValueOnce(undefined);
    }
    
    vi.mocked(db.execute).mockImplementation(executeMock);

    vi.mocked(embed.buildJobEmbeddingText).mockImplementation((job: any) =>
      `${job.title} ${job.company} ${job.location}`
    );

    const embedBatchMock = vi.fn().mockResolvedValue(
      Array.from({ length: 100 }, () => fakeEmbedding)
    );
    vi.mocked(embed.embedBatch).mockImplementation(embedBatchMock);

    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    await GET(request as any);

    expect(embedBatchMock).toHaveBeenCalledTimes(3);
    
    expect(embedBatchMock.mock.calls[0][0]).toHaveLength(100);
    expect(embedBatchMock.mock.calls[1][0]).toHaveLength(100);
    expect(embedBatchMock.mock.calls[2][0]).toHaveLength(50);
  });

  it('limits query to 500 jobs maximum', async () => {
    const mockJobs = Array.from({ length: 500 }, (_, i) => ({
      id: `job-${i}`,
      title: `Backend Developer ${i}`,
      company: `Tech Corp ${i}`,
      location: 'Sofia, Bulgaria',
      description_raw: `Job description ${i}`,
    }));

    const executeMock = vi.fn();
    executeMock.mockResolvedValueOnce(mockJobs as any);
    
    for (let i = 0; i < 500; i++) {
      executeMock.mockResolvedValueOnce(undefined);
    }
    
    vi.mocked(db.execute).mockImplementation(executeMock);

    vi.mocked(embed.buildJobEmbeddingText).mockImplementation((job: any) =>
      `${job.title} ${job.company} ${job.location}`
    );

    vi.mocked(embed.embedBatch).mockResolvedValue(
      Array.from({ length: 100 }, () => fakeEmbedding)
    );

    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total).toBe(500);
    expect(data.embedded).toBe(500);
  });

  it('handles individual update failures within a successful batch', async () => {
    const mockJobs = Array.from({ length: 100 }, (_, i) => ({
      id: `job-${i}`,
      title: `Backend Developer ${i}`,
      company: `Tech Corp ${i}`,
      location: 'Sofia, Bulgaria',
      description_raw: `Job description ${i}`,
    }));

    const executeMock = vi.fn();
    executeMock.mockResolvedValueOnce(mockJobs as any);
    
    for (let i = 0; i < 100; i++) {
      if (i === 2) {
        executeMock.mockRejectedValueOnce(new Error('Database constraint violation'));
      } else {
        executeMock.mockResolvedValueOnce(undefined);
      }
    }
    
    vi.mocked(db.execute).mockImplementation(executeMock);

    vi.mocked(embed.buildJobEmbeddingText).mockImplementation((job: any) =>
      `${job.title} ${job.company} ${job.location}`
    );

    vi.mocked(embed.embedBatch).mockResolvedValue(
      Array.from({ length: 100 }, () => fakeEmbedding)
    );

    const request = new Request('http://localhost:3000/api/embed/batch', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      embedded: 99,
      failed: 1,
      total: 100,
    });
  });
});
