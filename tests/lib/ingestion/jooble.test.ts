import { describe, it, expect } from 'vitest';
import { JOOBLE_SEARCHES } from '../../../src/lib/ingestion/jooble';

describe('Jooble ingestion - S-02', () => {
  it('should have 12 location-targeted Eastern Europe searches', () => {
    // S-02 acceptance: 12 location-targeted configs for BG, PL, RO, CZ
    const easternEuropeSearches = JOOBLE_SEARCHES.filter(s => 
      s.location === 'Bulgaria' || 
      s.location === 'Poland' || 
      s.location === 'Romania' || 
      s.location === 'Czech Republic'
    );
    
    expect(easternEuropeSearches.length).toBe(12);
  });

  it('should keep existing generic searches alongside location-targeted ones', () => {
    // S-02: Keep existing generic searches
    const genericSearches = JOOBLE_SEARCHES.filter(s => s.location === '');
    
    expect(genericSearches.length).toBeGreaterThanOrEqual(3);
  });

  it('should have specific Bulgaria searches', () => {
    // S-02: software developer, data scientist, software engineer, data analyst, product manager for Bulgaria
    const bulgariaSearches = JOOBLE_SEARCHES.filter(s => s.location === 'Bulgaria');
    const bulgariaKeywords = bulgariaSearches.map(s => s.keywords);
    
    expect(bulgariaKeywords).toContain('software developer');
    expect(bulgariaKeywords).toContain('data scientist');
    expect(bulgariaKeywords).toContain('software engineer');
    expect(bulgariaKeywords).toContain('data analyst');
    expect(bulgariaKeywords).toContain('product manager');
  });

  it('should have specific Poland searches', () => {
    // S-02: software developer, software engineer, data scientist for Poland
    const polandSearches = JOOBLE_SEARCHES.filter(s => s.location === 'Poland');
    const polandKeywords = polandSearches.map(s => s.keywords);
    
    expect(polandKeywords).toContain('software developer');
    expect(polandKeywords).toContain('software engineer');
    expect(polandKeywords).toContain('data scientist');
  });

  it('should have specific Romania searches', () => {
    // S-02: software developer, data analyst for Romania
    const romaniaSearches = JOOBLE_SEARCHES.filter(s => s.location === 'Romania');
    const romaniaKeywords = romaniaSearches.map(s => s.keywords);
    
    expect(romaniaKeywords).toContain('software developer');
    expect(romaniaKeywords).toContain('data analyst');
  });

  it('should have specific Czech Republic searches', () => {
    // S-02: software engineer, data analyst for Czech Republic
    const czechSearches = JOOBLE_SEARCHES.filter(s => s.location === 'Czech Republic');
    const czechKeywords = czechSearches.map(s => s.keywords);
    
    expect(czechKeywords).toContain('software engineer');
    expect(czechKeywords).toContain('data analyst');
  });

  it('should have total of at least 15 searches (3 generic + 12 location-targeted)', () => {
    // S-02: Combined total
    expect(JOOBLE_SEARCHES.length).toBeGreaterThanOrEqual(15);
  });
});
