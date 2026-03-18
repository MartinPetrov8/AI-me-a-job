import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { users, profiles, sessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('POST /api/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns both restore_token and session_token on valid email+restore_token', async () => {
    const mockUserId = 'user-123';
    const mockProfileId = 'profile-456';
    const mockRestoreToken = 'restore-abc123';
    const mockEmail = 'user@example.com';

    // Mock user lookup
    const mockUserSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: mockUserId, restoreToken: mockRestoreToken },
      ]),
    };

    // Mock profile lookup
    const mockProfileSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: mockProfileId,
          userId: mockUserId,
          cvFilename: 'resume.pdf',
          yearsExperience: 5,
          educationLevel: 'bachelors',
          fieldOfStudy: ['Computer Science'],
          sphereOfExpertise: ['Software Development'],
          seniorityLevel: 'mid',
          industry: ['Technology'],
          languages: ['English', 'Spanish'],
          keySkills: ['TypeScript', 'React'],
        },
      ]),
    };

    // Mock session insert
    const mockSessionInsert = {
      values: vi.fn().mockResolvedValue(undefined),
    };

    (db.select as any)
      .mockReturnValueOnce(mockUserSelect)
      .mockReturnValueOnce(mockProfileSelect);

    (db.insert as any).mockReturnValue(mockSessionInsert);

    const request = new Request('http://localhost:3000/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: mockEmail,
        restore_token: mockRestoreToken,
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.restore_token).toBe(mockRestoreToken);
    expect(data.data.session_token).toBeDefined();
    expect(typeof data.data.session_token).toBe('string');
    expect(data.data.session_token.length).toBe(32);
    expect(data.data.profile_id).toBe(mockProfileId);
  });

  it('creates session row in sessions table with matching sessionToken and expiresAt ~7 days out', async () => {
    const mockUserId = 'user-789';
    const mockProfileId = 'profile-101';
    const mockRestoreToken = 'restore-xyz789';
    const mockEmail = 'another@example.com';

    const mockUserSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        { id: mockUserId, restoreToken: mockRestoreToken },
      ]),
    };

    const mockProfileSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: mockProfileId,
          userId: mockUserId,
          cvFilename: 'cv.pdf',
          yearsExperience: 3,
          educationLevel: 'masters',
          fieldOfStudy: ['Engineering'],
          sphereOfExpertise: ['Backend'],
          seniorityLevel: 'junior',
          industry: ['Finance'],
          languages: ['English'],
          keySkills: ['Node.js'],
        },
      ]),
    };

    let capturedSessionValues: any;
    const mockSessionInsert = {
      values: vi.fn().mockImplementation((vals) => {
        capturedSessionValues = vals;
        return Promise.resolve(undefined);
      }),
    };

    (db.select as any)
      .mockReturnValueOnce(mockUserSelect)
      .mockReturnValueOnce(mockProfileSelect);

    (db.insert as any).mockReturnValue(mockSessionInsert);

    const request = new Request('http://localhost:3000/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: mockEmail,
        restore_token: mockRestoreToken,
      }),
    });

    const beforeRequest = Date.now();
    await POST(request as any);
    const afterRequest = Date.now();

    expect(db.insert).toHaveBeenCalledWith(sessions);
    expect(capturedSessionValues).toBeDefined();
    expect(capturedSessionValues.profileId).toBe(mockProfileId);
    expect(capturedSessionValues.sessionToken).toBeDefined();
    expect(typeof capturedSessionValues.sessionToken).toBe('string');
    expect(capturedSessionValues.sessionToken.length).toBe(32);

    const expiresAt = capturedSessionValues.expiresAt.getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expectedExpiresAtMin = beforeRequest + sevenDaysInMs;
    const expectedExpiresAtMax = afterRequest + sevenDaysInMs;

    expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiresAtMin);
    expect(expiresAt).toBeLessThanOrEqual(expectedExpiresAtMax);
  });

  it('returns 404 for invalid email+restore_token combination', async () => {
    const mockUserSelect = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    (db.select as any).mockReturnValue(mockUserSelect);

    const request = new Request('http://localhost:3000/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@example.com',
        restore_token: 'wrong-token',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.errors).toBeDefined();
    expect(data.errors[0].code).toBe('NOT_FOUND');
  });

  it('returns 400 for invalid request body', async () => {
    const request = new Request('http://localhost:3000/api/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        restore_token: '',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.errors).toBeDefined();
    expect(data.errors.length).toBeGreaterThan(0);
  });
});
