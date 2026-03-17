import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '@/app/api/preferences/route';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock auth — bypass ownership check in unit tests
vi.mock('@/lib/auth', () => ({
  verifyProfileOwnership: vi.fn().mockResolvedValue({ ok: true, userId: 'test-user-id' }),
}));

vi.mock('@/lib/auth/validate-restore-token', () => ({
  validateRestoreToken: vi.fn().mockResolvedValue(undefined),
}));

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn(),
    select: vi.fn(),
  },
}));

describe('GET /api/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET with valid profile_id → 200 + stored preferences', async () => {
    const mockProfile = {
      prefLocation: 'London',
      prefWorkMode: 'Remote',
      prefEmploymentType: ['Full-time'],
      prefSalaryMin: 60000,
      prefSalaryMax: 100000,
      prefSalaryCurrency: 'GBP',
      prefRelocation: false,
    };

    (db.select as any) = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockProfile]),
        }),
      }),
    });

    const request = new Request('http://localhost/api/preferences?profile_id=test-profile-id', {
      method: 'GET',
      headers: { 'x-restore-token': 'test-token' },
    });

    const response = await GET(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.pref_location).toBe('London');
    expect(data.data.pref_work_mode).toBe('Remote');
    expect(data.data.pref_employment_type).toEqual(['Full-time']);
    expect(data.data.pref_salary_min).toBe(60000);
  });

  it('GET without profile_id → 400', async () => {
    const request = new Request('http://localhost/api/preferences', {
      method: 'GET',
    });
    const response = await GET(request as any);
    expect(response.status).toBe(400);
  });

  it('GET with non-existent profile → 404', async () => {
    (db.select as any) = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const request = new Request('http://localhost/api/preferences?profile_id=non-existent', {
      method: 'GET',
      headers: { 'x-restore-token': 'test-token' },
    });
    const response = await GET(request as any);
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PUT with valid preferences → 200 + updated profile', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'test-profile-id',
              userId: 'test-user-id',
              prefWorkMode: 'Remote',
              prefEmploymentType: ['Full-time'],
              prefLocation: 'Berlin, Germany',
              prefRelocation: true,
              prefSalaryMin: 50000,
              prefSalaryMax: 80000,
              prefSalaryCurrency: 'EUR',
            },
          ]),
        }),
      }),
    });

    (db.update as any) = mockUpdate;

    const request = new Request('http://localhost/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: 'test-profile-id',
        prefWorkMode: 'Remote',
        prefEmploymentType: ['Full-time'],
        prefLocation: 'Berlin, Germany',
        prefRelocation: true,
        prefSalaryMin: 50000,
        prefSalaryMax: 80000,
        prefSalaryCurrency: 'EUR',
      }),
    });

    const response = await PUT(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: {
        profile_id: 'test-profile-id',
        updated: true,
      },
    });
    expect(mockUpdate).toHaveBeenCalledWith(profiles);
  });

  it('PUT with invalid work_mode value → 400', async () => {
    const request = new Request('http://localhost/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: 'test-profile-id',
        prefWorkMode: 'InvalidMode',
      }),
    });

    const response = await PUT(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
    expect(data.details).toBeTruthy();
  });

  it('PUT with no preferences (all optional) → 200', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'test-profile-id',
              userId: 'test-user-id',
            },
          ]),
        }),
      }),
    });

    (db.update as any) = mockUpdate;

    const request = new Request('http://localhost/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: 'test-profile-id',
      }),
    });

    const response = await PUT(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      data: {
        profile_id: 'test-profile-id',
        updated: true,
      },
    });
  });
});
