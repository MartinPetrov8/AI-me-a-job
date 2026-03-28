import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/embed/route';
import { db } from '@/lib/db';
import { profiles, jobs } from '@/lib/db/schema';
import * as embed from '@/lib/embedding/embed';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/lib/embedding/embed', () => ({
  embedText: vi.fn(),
  buildProfileEmbeddingText: vi.fn(),
  buildJobEmbeddingText: vi.fn(),
}));

describe('POST /api/embed', () => {
  const validSecret = 'test-cron-secret';
  const fakeEmbedding = new Array(768).fill(0.1);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = validSecret;
  });

  it('returns 401 when CRON_SECRET header is missing', async () => {
    const request = new Request('http://localhost:3000/api/embed', {
      method: 'POST',
      body: JSON.stringify({ profile_id: 'test-id' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when CRON_SECRET header is invalid', async () => {
    const request = new Request('http://localhost:3000/api/embed', {
      method: 'POST',
      headers: { 'x-cron-secret': 'wrong-secret' },
      body: JSON.stringify({ profile_id: 'test-id' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when profile_id is missing', async () => {
    const request = new Request('http://localhost:3000/api/embed', {
      method: 'POST',
      headers: { 'x-cron-secret': validSecret },
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('profile_id is required');
  });

  it('returns 404 when profile does not exist', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const request = new Request('http://localhost:3000/api/embed', {
      method: 'POST',
      headers: { 'x-cron-secret': validSecret },
      body: JSON.stringify({ profile_id: 'nonexistent-id' }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Profile not found');
  });

  it('recomputes profile embedding and returns 200 with dimensions', async () => {
    const profileId = 'profile-123';
    const mockProfile = {
      id: profileId,
      titleInferred: 'Senior Developer',
      sphereOfExpertise: 'Backend',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      keySkills: ['Python', 'Node.js'],
      yearsExperience: '5-10',
      prefLocation: 'Remote',
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockProfile]),
        }),
      }),
    } as any);

    vi.mocked(embed.buildProfileEmbeddingText).mockReturnValue('Senior Developer Backend...');
    vi.mocked(embed.embedText).mockResolvedValue(fakeEmbedding);

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.update).mockImplementation(mockUpdate as any);

    const request = new Request('http://localhost:3000/api/embed', {
      method: 'POST',
      headers: { 'x-cron-secret': validSecret },
      body: JSON.stringify({ profile_id: profileId }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ embedded: true, dimensions: 768 });
    expect(embed.embedText).toHaveBeenCalledWith('Senior Developer Backend...');
    expect(mockUpdate).toHaveBeenCalledWith(profiles);
  });
});

describe('GET /api/embed', () => {
  const validSecret = 'test-cron-secret';
  const fakeEmbedding = new Array(768).fill(0.1);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = validSecret;
  });

  it('returns 401 when CRON_SECRET header is missing', async () => {
    const request = new Request('http://localhost:3000/api/embed?job_id=test-id', {
      method: 'GET',
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when CRON_SECRET header is invalid', async () => {
    const request = new Request('http://localhost:3000/api/embed?job_id=test-id', {
      method: 'GET',
      headers: { 'x-cron-secret': 'wrong-secret' },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when job_id query param is missing', async () => {
    const request = new Request('http://localhost:3000/api/embed', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('job_id query param is required');
  });

  it('returns 404 when job does not exist', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const request = new Request('http://localhost:3000/api/embed?job_id=nonexistent-id', {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Job not found');
  });

  it('recomputes job embedding and returns 200 with dimensions', async () => {
    const jobId = 'job-123';
    const mockJob = {
      id: jobId,
      title: 'Backend Developer',
      company: 'Tech Corp',
      location: 'Sofia, Bulgaria',
      descriptionRaw: 'We are looking for a backend developer...',
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockJob]),
        }),
      }),
    } as any);

    vi.mocked(embed.buildJobEmbeddingText).mockReturnValue('Backend Developer Tech Corp Sofia...');
    vi.mocked(embed.embedText).mockResolvedValue(fakeEmbedding);

    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    vi.mocked(db.update).mockImplementation(mockUpdate as any);

    const request = new Request(`http://localhost:3000/api/embed?job_id=${jobId}`, {
      method: 'GET',
      headers: { 'x-cron-secret': validSecret },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ embedded: true, dimensions: 768 });
    expect(embed.embedText).toHaveBeenCalledWith('Backend Developer Tech Corp Sofia...');
    expect(mockUpdate).toHaveBeenCalledWith(jobs);
  });
});
