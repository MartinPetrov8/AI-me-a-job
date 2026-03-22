/**
 * Unit tests for POST /api/embed and GET /api/embed.
 * Mocks DB and embedding functions — no real API calls or DB access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks (must be hoisted before imports) ────────────────────────────────────
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

import { POST, GET } from '@/app/api/embed/route';
import { db } from '@/lib/db';
import { embedText, buildProfileEmbeddingText, buildJobEmbeddingText } from '@/lib/embedding/embed';

// ── Helpers ───────────────────────────────────────────────────────────────────
const DUMMY_EMBEDDING = new Array(1536).fill(0.1);
const CRON_SECRET = 'test-cron-secret-xyz';

function makeRequest(method: string, body?: object, url = 'http://localhost/api/embed', secret?: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (secret !== undefined) {
    headers['x-cron-secret'] = secret;
  }
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function setupDbMocks(profileRow?: object, jobRow?: object) {
  const mockWhere = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockResolvedValue(profileRow ? [profileRow] : (jobRow ? [jobRow] : []));
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });

  // For update chain
  const mockSet = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

  (db.select as any).mockReturnValue({ from: mockFrom });
  (db.update as any).mockReturnValue({ set: mockSet });

  // Make where chain work for both select and update
  mockWhere.mockReturnValue({ limit: mockLimit });
}

// ── POST /api/embed ───────────────────────────────────────────────────────────
describe('POST /api/embed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    vi.mocked(embedText).mockResolvedValue(DUMMY_EMBEDDING);
    vi.mocked(buildProfileEmbeddingText).mockReturnValue('Senior TypeScript Engineer');
  });

  it('returns 401 when CRON_SECRET header is missing', async () => {
    const request = makeRequest('POST', { profile_id: 'some-id' });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 401 when CRON_SECRET header is wrong', async () => {
    const request = makeRequest('POST', { profile_id: 'some-id' }, 'http://localhost/api/embed', 'wrong-secret');
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 200 with embedded: true when profile_id is valid', async () => {
    const mockProfile = {
      id: 'profile-uuid-123',
      titleInferred: 'TypeScript Engineer',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      keySkills: ['TypeScript', 'Node.js'],
      yearsExperience: '5-9',
      prefLocation: null,
    };

    setupDbMocks(mockProfile);

    const request = makeRequest(
      'POST',
      { profile_id: 'profile-uuid-123' },
      'http://localhost/api/embed',
      CRON_SECRET
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.embedded).toBe(true);
    expect(data.dimensions).toBe(1536);
  });

  it('returns 400 when profile_id is missing from body', async () => {
    const request = makeRequest('POST', {}, 'http://localhost/api/embed', CRON_SECRET);
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

// ── GET /api/embed ────────────────────────────────────────────────────────────
describe('GET /api/embed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
    vi.mocked(embedText).mockResolvedValue(DUMMY_EMBEDDING);
    vi.mocked(buildJobEmbeddingText).mockReturnValue('Backend Engineer Node.js Remote');
  });

  it('returns 401 when CRON_SECRET header is missing', async () => {
    const request = makeRequest('GET', undefined, 'http://localhost/api/embed?job_id=some-job');
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns 200 with embedded: true when job_id is valid', async () => {
    const mockJob = {
      id: 'job-uuid-456',
      title: 'Backend Engineer',
      company: 'TechCorp',
      location: 'Remote',
      descriptionRaw: 'We are hiring a backend engineer...',
    };

    setupDbMocks(undefined, mockJob);

    const request = new NextRequest('http://localhost/api/embed?job_id=job-uuid-456', {
      method: 'GET',
      headers: { 'x-cron-secret': CRON_SECRET },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.embedded).toBe(true);
    expect(data.dimensions).toBe(1536);
  });

  it('returns 400 when job_id query param is missing', async () => {
    const request = new NextRequest('http://localhost/api/embed', {
      method: 'GET',
      headers: { 'x-cron-secret': CRON_SECRET },
    });

    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
