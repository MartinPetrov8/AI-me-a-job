import { describe, it, expect } from 'vitest';
import { normalizeUrl, computeContentHash } from '../../../src/lib/ingestion/dedup';

describe('normalizeUrl', () => {
  it('strips UTM params', () => {
    const url = 'https://boards.greenhouse.io/acme/jobs/123?utm_source=adzuna&utm_medium=organic&utm_campaign=q1';
    expect(normalizeUrl(url)).toBe('https://boards.greenhouse.io/acme/jobs/123');
  });

  it('strips ref and source params', () => {
    const url = 'https://lever.co/company/job/456?ref=jooble&source=linkedin';
    expect(normalizeUrl(url)).toBe('https://lever.co/company/job/456');
  });

  it('returns null for empty string', () => {
    expect(normalizeUrl('')).toBeNull();
  });

  it('returns null for invalid URL', () => {
    expect(normalizeUrl('not-a-url')).toBeNull();
  });

  it('removes trailing slash', () => {
    expect(normalizeUrl('https://example.com/jobs/123/')).toBe('https://example.com/jobs/123');
  });

  it('lowercases hostname', () => {
    expect(normalizeUrl('https://Boards.Greenhouse.IO/acme/jobs/123')).toBe('https://boards.greenhouse.io/acme/jobs/123');
  });

  it('same ATS link from two sources → same canonical URL', () => {
    const adzunaUrl = 'https://boards.greenhouse.io/acme/jobs/123?utm_source=adzuna';
    const joobleUrl = 'https://boards.greenhouse.io/acme/jobs/123?source=jooble';
    expect(normalizeUrl(adzunaUrl)).toBe(normalizeUrl(joobleUrl));
  });
});

describe('computeContentHash', () => {
  it('is deterministic for identical inputs', () => {
    const date = new Date('2026-03-14');
    const h1 = computeContentHash('Senior Data Scientist', 'Acme Corp', 'GB', date);
    const h2 = computeContentHash('Senior Data Scientist', 'Acme Corp', 'GB', date);
    expect(h1).toBe(h2);
  });

  it('differs when company differs', () => {
    const date = new Date('2026-03-14');
    const h1 = computeContentHash('Software Engineer', 'Acme Corp', 'US', date);
    const h2 = computeContentHash('Software Engineer', 'Other Corp', 'US', date);
    expect(h1).not.toBe(h2);
  });

  it('differs when title differs', () => {
    const date = new Date('2026-03-14');
    const h1 = computeContentHash('Junior Developer', 'Acme', 'DE', date);
    const h2 = computeContentHash('Senior Developer', 'Acme', 'DE', date);
    expect(h1).not.toBe(h2);
  });

  it('differs when country differs', () => {
    const date = new Date('2026-03-14');
    const h1 = computeContentHash('Product Manager', 'Acme', 'GB', date);
    const h2 = computeContentHash('Product Manager', 'Acme', 'US', date);
    expect(h1).not.toBe(h2);
  });

  it('handles null company and country', () => {
    const hash = computeContentHash('Data Analyst', null, null, null);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(32); // MD5 hex = 32 chars
  });

  it('same job posted same week from two sources → same hash', () => {
    // Both postings from the same week (both Mon–Sun of W11 2026)
    const date1 = new Date('2026-03-09'); // Monday W11
    const date2 = new Date('2026-03-13'); // Friday W11
    const h1 = computeContentHash('Data Scientist', 'Google', 'GB', date1);
    const h2 = computeContentHash('Data Scientist', 'Google', 'GB', date2);
    expect(h1).toBe(h2);
  });

  it('same job in different weeks → different hash', () => {
    const week11 = new Date('2026-03-09');
    const week12 = new Date('2026-03-16');
    const h1 = computeContentHash('Data Scientist', 'Google', 'GB', week11);
    const h2 = computeContentHash('Data Scientist', 'Google', 'GB', week12);
    expect(h1).not.toBe(h2);
  });
});
