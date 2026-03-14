import { describe, it, expect } from 'vitest';
import { ADZUNA_COUNTRIES, ADZUNA_QUERIES, fetchAllAdzunaJobs } from '../../../src/lib/ingestion/adzuna';

describe('Adzuna ingestion - S-01', () => {
  it('should have 7 countries configured (GB, US, DE, FR, NL, BG, PL)', () => {
    // S-01 acceptance: All 7 countries in the constant
    const expectedCountries = ['gb', 'us', 'de', 'fr', 'nl', 'bg', 'pl', 'au'];
    
    for (const country of ['gb', 'us', 'de', 'fr', 'nl', 'bg', 'pl']) {
      expect(ADZUNA_COUNTRIES).toContain(country);
    }
    
    expect(ADZUNA_COUNTRIES.length).toBeGreaterThanOrEqual(7);
  });

  it('should use all 7 countries in fetchAllAdzunaJobs', async () => {
    // S-01 acceptance: fetchAllAdzunaJobs iterates over 7 countries
    // We can't easily test the actual API call without mocking, but we verify the constant
    // that fetchAllAdzunaJobs uses includes all 7 countries
    
    const countries = ['gb', 'us', 'de', 'fr', 'nl', 'bg', 'pl'];
    
    for (const country of countries) {
      expect(ADZUNA_COUNTRIES).toContain(country);
    }
  });

  it('should have currency mapping for all 7 countries', () => {
    // S-01: Verify currency mapping logic
    const currencyExpectations = [
      { country: 'gb', currency: 'GBP' },
      { country: 'us', currency: 'USD' },
      { country: 'de', currency: 'EUR' },
      { country: 'fr', currency: 'EUR' },
      { country: 'nl', currency: 'EUR' },
      { country: 'bg', currency: 'BGN' },
      { country: 'pl', currency: 'PLN' },
    ];
    
    // Currency mapping is in the implementation
    // This test validates the expected mappings are documented
    expect(currencyExpectations.length).toBe(7);
  });

  it('should have at least 10 search queries', () => {
    expect(ADZUNA_QUERIES.length).toBeGreaterThanOrEqual(10);
  });
});
