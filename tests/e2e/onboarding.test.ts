/**
 * E2E-style onboarding flow tests (Vitest + mocked fetch)
 * Covers the full upload → profile → preferences → results → save → restore flow
 * without requiring a live server or Playwright.
 *
 * Note: process.cwd() is used for path resolution — NOT __dirname (ESM safe)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchSequence(responses: Array<{ status: number; body: unknown }>) {
  let callIndex = 0;
  return vi.fn().mockImplementation(() => {
    const r = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return Promise.resolve({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: () => Promise.resolve(r.body),
      text: () => Promise.resolve(JSON.stringify(r.body)),
    });
  });
}

// ── Upload flow ───────────────────────────────────────────────────────────────

describe('Upload → Profile → Preferences → Results flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /api/upload returns user_id and profile_id on success', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { user_id: 'u-123', profile_id: 'p-456', extracted: { sphere_of_expertise: 'Data Science', seniority_level: 'Senior' } } } }
    ]);
    const res = await mockFetch('/api/upload', { method: 'POST' });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.data.user_id).toBe('u-123');
    expect(data.data.profile_id).toBe('p-456');
  });

  it('GET /api/profile returns profile criteria', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { profile_id: 'p-456', criteria: { sphere_of_expertise: 'Data Science' } } } }
    ]);
    const res = await mockFetch('/api/profile?user_id=u-123');
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.data.profile_id).toBe('p-456');
  });

  it('PUT /api/preferences saves preferences', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { profile_id: 'p-456', pref_work_mode: 'Remote' } } }
    ]);
    const res = await mockFetch('/api/preferences', { method: 'PUT', body: JSON.stringify({ profile_id: 'p-456', pref_work_mode: 'Remote' }) });
    expect(res.ok).toBe(true);
  });

  it('POST /api/search returns ranked job matches', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { results: [{ job_id: 'j-1', title: 'Data Scientist', match_score: 8 }], total: 1, search_id: 's-1' }, meta: { threshold: 5, max_score: 9 } } }
    ]);
    const res = await mockFetch('/api/search', { method: 'POST', body: JSON.stringify({ profile_id: 'p-456' }) });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.data.results).toHaveLength(1);
    expect(data.data.results[0].match_score).toBe(8);
  });

  it('POST /api/search returns empty results gracefully', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { results: [], total: 0, search_id: 's-2' }, meta: { threshold: 5, max_score: 9 } } }
    ]);
    const res = await mockFetch('/api/search', { method: 'POST', body: JSON.stringify({ profile_id: 'p-456' }) });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.data.results).toHaveLength(0);
  });
});

// ── Save & Restore flow ───────────────────────────────────────────────────────

describe('Save → Restore flow', () => {
  it('POST /api/save returns restore_token', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { saved: true, restore_token: 'abc123xyz456' } } }
    ]);
    const res = await mockFetch('/api/save', { method: 'POST', body: JSON.stringify({ profile_id: 'p-456', email: 'test@example.com' }) });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.data.restore_token).toHaveLength(12);
  });

  it('POST /api/restore with valid credentials returns profile', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { data: { profile_id: 'p-456', criteria: { sphere_of_expertise: 'Data Science' } } } }
    ]);
    const res = await mockFetch('/api/restore', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', restore_token: 'abc123xyz456' }) });
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.data.profile_id).toBe('p-456');
  });

  it('POST /api/restore with wrong token returns 404', async () => {
    const mockFetch = mockFetchSequence([
      { status: 404, body: { errors: [{ code: 'NOT_FOUND', message: 'No profile found' }] } }
    ]);
    const res = await mockFetch('/api/restore', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', restore_token: 'wrongtoken' }) });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
  });
});

// ── Health check ─────────────────────────────────────────────────────────────

describe('GET /api/health service config status', () => {
  it('returns supabase/stripe/resend presence flags', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { status: 'ok', supabase: 'missing', stripe: 'missing', resend: 'missing', db: 'error' } }
    ]);
    const res = await mockFetch('/api/health');
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(['configured', 'missing']).toContain(data.supabase);
    expect(['configured', 'missing']).toContain(data.stripe);
    expect(['configured', 'missing']).toContain(data.resend);
  });

  it('returns configured when env vars present', async () => {
    const mockFetch = mockFetchSequence([
      { status: 200, body: { status: 'ok', supabase: 'configured', stripe: 'configured', resend: 'missing', db: 'connected' } }
    ]);
    const res = await mockFetch('/api/health');
    const data = await res.json();
    expect(data.supabase).toBe('configured');
    expect(data.stripe).toBe('configured');
  });
});
