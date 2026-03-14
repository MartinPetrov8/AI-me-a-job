import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateRestoreToken } from './validate-restore-token';
import * as dbModule from '../db';

// Mock the db module
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('validateRestoreToken', () => {
  const mockProfileId = 'test-profile-id';
  const mockToken = 'valid-restore-token';
  const mockWrongToken = 'wrong-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 401 Response when token is null', async () => {
    await expect(validateRestoreToken(mockProfileId, null)).rejects.toThrow(Response);

    try {
      await validateRestoreToken(mockProfileId, null);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    }
  });

  it('throws 401 Response when token is mismatched', async () => {
    // Mock DB query to return a different token
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue([
      { restoreToken: mockToken },
    ]);

    (dbModule.db.select as any).mockReturnValue({
      from: mockFrom,
    });
    mockFrom.mockReturnValue({
      innerJoin: mockInnerJoin,
    });
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockReturnValue({
      limit: mockLimit,
    });

    await expect(validateRestoreToken(mockProfileId, mockWrongToken)).rejects.toThrow(Response);

    try {
      await validateRestoreToken(mockProfileId, mockWrongToken);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    }
  });

  it('throws 401 Response when profile not found', async () => {
    // Mock DB query to return empty array
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue([]);

    (dbModule.db.select as any).mockReturnValue({
      from: mockFrom,
    });
    mockFrom.mockReturnValue({
      innerJoin: mockInnerJoin,
    });
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockReturnValue({
      limit: mockLimit,
    });

    await expect(validateRestoreToken(mockProfileId, mockToken)).rejects.toThrow(Response);

    try {
      await validateRestoreToken(mockProfileId, mockToken);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    }
  });

  it('returns void without throwing when token matches', async () => {
    // Mock DB query to return matching token
    const mockFrom = vi.fn().mockReturnThis();
    const mockInnerJoin = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockLimit = vi.fn().mockResolvedValue([
      { restoreToken: mockToken },
    ]);

    (dbModule.db.select as any).mockReturnValue({
      from: mockFrom,
    });
    mockFrom.mockReturnValue({
      innerJoin: mockInnerJoin,
    });
    mockInnerJoin.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockReturnValue({
      limit: mockLimit,
    });

    // Should not throw
    await expect(validateRestoreToken(mockProfileId, mockToken)).resolves.toBeUndefined();
  });
});
