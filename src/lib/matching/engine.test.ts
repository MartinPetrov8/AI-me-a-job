import { describe, it, expect, vi } from 'vitest';

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { scoreLocation } from './engine';

describe('scoreLocation', () => {
  it('returns 2 when prefLocation is set AND city/country match found in jobLocation', () => {
    expect(scoreLocation('Sofia', 'Sofia, Bulgaria', false)).toBe(2);
    expect(scoreLocation('London', 'London, UK', false)).toBe(2);
    expect(scoreLocation('Berlin', 'Berlin, Germany', false)).toBe(2);
    expect(scoreLocation('bulgaria', 'Sofia, Bulgaria', false)).toBe(2);
  });

  it('returns 1 when prefLocation is null', () => {
    expect(scoreLocation(null, 'London, UK', false)).toBe(1);
    expect(scoreLocation(null, 'Sofia, Bulgaria', false)).toBe(1);
    expect(scoreLocation(null, null, false)).toBe(1);
  });

  it('returns 1 when isRemote is true', () => {
    expect(scoreLocation('Sofia', 'Remote', true)).toBe(1);
    expect(scoreLocation('Sofia', 'London, UK', true)).toBe(1);
    expect(scoreLocation('Sofia', null, true)).toBe(1);
  });

  it('returns 1 when jobLocation is null', () => {
    expect(scoreLocation('Sofia', null, false)).toBe(1);
    expect(scoreLocation('London', null, false)).toBe(1);
  });

  it('returns 0 when prefLocation is set but no match found in jobLocation', () => {
    expect(scoreLocation('Sofia', 'London, UK', false)).toBe(0);
    expect(scoreLocation('Berlin', 'Paris, France', false)).toBe(0);
    expect(scoreLocation('New York', 'Tokyo, Japan', false)).toBe(0);
  });

  it('handles partial matches correctly', () => {
    expect(scoreLocation('York', 'New York, USA', false)).toBe(2);
    expect(scoreLocation('United', 'London, United Kingdom', false)).toBe(2);
  });
});
