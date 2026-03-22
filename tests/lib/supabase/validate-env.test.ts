import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateSupabaseEnv } from '@/lib/supabase/validate-env';

const SUPABASE_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

describe('validateSupabaseEnv', () => {
  // Save and restore env vars around each test
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const key of SUPABASE_VARS) {
      saved[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of SUPABASE_VARS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  it('returns valid: true and empty missing[] when all vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

    const result = validateSupabaseEnv();

    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns valid: false and missing contains the missing var when one is absent', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = validateSupabaseEnv();

    expect(result.valid).toBe(false);
    expect(result.missing).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(result.missing).toHaveLength(1);
  });

  it('returns valid: false and missing has 3 items when all vars are absent', () => {
    for (const key of SUPABASE_VARS) {
      delete process.env[key];
    }

    const result = validateSupabaseEnv();

    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(3);
    for (const key of SUPABASE_VARS) {
      expect(result.missing).toContain(key);
    }
  });
});
