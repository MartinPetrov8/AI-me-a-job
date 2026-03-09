import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    // Token invalidation (ISSUE-2 fix)
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email', restoreToken: 'restore_token' },
  profiles: { id: 'id', userId: 'user_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

const MOCK_PROFILE = {
  id: 'profile-uuid-1',
  userId: 'user-uuid-1',
  cvFilename: 'cv.pdf',
  yearsExperience: '5-9',
  educationLevel: 'Bachelors',
  fieldOfStudy: 'STEM',
  sphereOfExpertise: 'Engineering',
  seniorityLevel: 'Senior',
  industry: 'Technology',
  languages: ['English'],
  keySkills: ['TypeScript', 'React'],
};

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/restore', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with full profile on correct email + token', async () => {
    const { db } = await import('@/lib/db');
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn()
            .mockResolvedValueOnce([{ id: 'user-uuid-1' }]) // user found
            .mockResolvedValueOnce([MOCK_PROFILE]) // profile found
        })
      })
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectMock);

    const { POST } = await import('@/app/api/restore/route');
    const req = makeRequest({ email: 'test@example.com', restore_token: 'abc123def456' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.profile_id).toBe('profile-uuid-1');
    expect(data.data.profile.yearsExperience).toBe('5-9');
  });

  it('returns 404 for correct email + wrong token', async () => {
    const { db } = await import('@/lib/db');
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]) // no user matched
        })
      })
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectMock);

    const { POST } = await import('@/app/api/restore/route');
    const req = makeRequest({ email: 'test@example.com', restore_token: 'wrongtoken1' });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 404 for wrong email + correct token', async () => {
    const { db } = await import('@/lib/db');
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectMock);

    const { POST } = await import('@/app/api/restore/route');
    const req = makeRequest({ email: 'wrong@example.com', restore_token: 'abc123def456' });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 404 for nonexistent email', async () => {
    const { db } = await import('@/lib/db');
    const selectMock = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    });
    (db.select as ReturnType<typeof vi.fn>).mockImplementation(selectMock);

    const { POST } = await import('@/app/api/restore/route');
    const req = makeRequest({ email: 'nobody@example.com', restore_token: 'abc123def456' });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
