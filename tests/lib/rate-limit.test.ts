import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests within limit', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.1' });
    
    const result1 = checkRateLimit('/api/upload', headers);
    expect(result1.allowed).toBe(true);
    
    const result2 = checkRateLimit('/api/upload', headers);
    expect(result2.allowed).toBe(true);
  });

  it('blocks requests after limit exceeded', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.2' });
    
    for (let i = 0; i < 5; i++) {
      checkRateLimit('/api/upload', headers);
    }
    
    const blocked = checkRateLimit('/api/upload', headers);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfter).toBeGreaterThan(0);
    }
  });

  it('resets count after time window', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.3' });
    
    for (let i = 0; i < 5; i++) {
      checkRateLimit('/api/upload', headers);
    }
    
    const blocked = checkRateLimit('/api/upload', headers);
    expect(blocked.allowed).toBe(false);
    
    vi.advanceTimersByTime(60 * 60 * 1000 + 1000);
    
    const allowed = checkRateLimit('/api/upload', headers);
    expect(allowed.allowed).toBe(true);
  });

  it('exempts health endpoint from rate limiting', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.4' });
    
    for (let i = 0; i < 100; i++) {
      const result = checkRateLimit('/api/health', headers);
      expect(result.allowed).toBe(true);
    }
  });

  it('exempts pipeline endpoint from rate limiting', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.5' });
    
    for (let i = 0; i < 100; i++) {
      const result = checkRateLimit('/api/pipeline', headers);
      expect(result.allowed).toBe(true);
    }
  });

  it('tracks different IPs separately', () => {
    const headers1 = new Headers({ 'x-forwarded-for': '192.168.1.6' });
    const headers2 = new Headers({ 'x-forwarded-for': '192.168.1.7' });
    
    for (let i = 0; i < 5; i++) {
      checkRateLimit('/api/upload', headers1);
    }
    
    const blocked = checkRateLimit('/api/upload', headers1);
    expect(blocked.allowed).toBe(false);
    
    const allowed = checkRateLimit('/api/upload', headers2);
    expect(allowed.allowed).toBe(true);
  });

  it('applies different limits for different endpoints', () => {
    const headers = new Headers({ 'x-forwarded-for': '192.168.1.8' });
    
    for (let i = 0; i < 20; i++) {
      checkRateLimit('/api/search', headers);
    }
    
    const blocked = checkRateLimit('/api/search', headers);
    expect(blocked.allowed).toBe(false);
    
    const allowed = checkRateLimit('/api/upload', headers);
    expect(allowed.allowed).toBe(true);
  });
});
