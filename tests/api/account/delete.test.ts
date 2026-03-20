import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/account/delete/route';
import { db } from '@/lib/db';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe('DELETE /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without authentication', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    } as never);

    const response = await POST();
    expect(response.status).toBe(401);
    
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 404 when user not found in database', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    } as never);

    const response = await POST();
    expect(response.status).toBe(404);
  });

  it('deletes user data successfully', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as never);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [{ id: 'db-user-123', authId: 'user-123' }]),
        })),
      })),
    } as never);

    const response = await POST();
    expect(response.status).toBe(200);
    
    const json = await response.json();
    expect(json.deleted).toBe(true);
    expect(json.message).toContain('permanently deleted');
  });
});
