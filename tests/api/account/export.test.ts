import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/account/export/route';
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
  },
}));

describe('GET /api/account/export', () => {
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

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('returns user data with correct headers', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as never);

    let callCount = 0;
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return {
              limit: vi.fn(() => [
                {
                  id: 'db-user-123',
                  email: 'test@example.com',
                  createdAt: new Date('2024-01-01'),
                },
              ]),
            };
          }
          return { limit: vi.fn(() => []) };
        }),
      })),
    } as never);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('aimeajob-data-export.json');
  });

  it('includes user email in export data', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
    } as never);

    let callCount = 0;
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          callCount++;
          if (callCount === 1) {
            return {
              limit: vi.fn(() => [
                {
                  id: 'db-user-123',
                  email: 'test@example.com',
                  createdAt: new Date('2024-01-01'),
                },
              ]),
            };
          }
          return { limit: vi.fn(() => []) };
        }),
      })),
    } as never);

    const response = await GET();
    const text = await response.text();
    const data = JSON.parse(text);
    
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });
});
