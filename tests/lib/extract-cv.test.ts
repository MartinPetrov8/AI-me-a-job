import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractCvCriteria, LLMExtractionError } from '@/lib/llm/extract-cv';

// Mock callLLM — keeps tests isolated from Anthropic API and avoids browser-env crash
vi.mock('@/lib/llm/client', () => ({
  callLLM: vi.fn(),
  LLM_PROVIDER: 'anthropic',
  LLM_MODEL: 'claude-haiku-3-5-20241022',
}));

import { callLLM } from '@/lib/llm/client';

describe('extractCvCriteria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extract criteria from valid LLM response', async () => {
    const mockResponse = {
      years_experience: '5-9',
      education_level: 'Masters',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Senior',
      languages: ['English', 'Spanish'],
      industry: 'Technology',
      key_skills: ['Python', 'Go', 'Kubernetes'],
    };

    vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockResponse));

    const result = await extractCvCriteria('Sample CV text');

    expect(result).toEqual(mockResponse);
    expect(callLLM).toHaveBeenCalledTimes(1);
  });

  it('should set fields to null when LLM returns values not in bounded list', async () => {
    const mockResponse = {
      years_experience: 'invalid-value',
      education_level: 'Some College',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Invalid Sphere',
      seniority_level: 'Senior',
      languages: ['English'],
      industry: 'Technology',
      key_skills: ['Python'],
    };

    vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockResponse));

    const result = await extractCvCriteria('Sample CV text');

    expect(result.years_experience).toBeNull();
    expect(result.education_level).toBeNull();
    expect(result.sphere_of_expertise).toBeNull();
    expect(result.field_of_study).toBe('STEM');
    expect(result.seniority_level).toBe('Senior');
  });

  it('should strip markdown code fences from LLM response', async () => {
    const mockResponse = { years_experience: '5-9', education_level: 'Masters', field_of_study: 'STEM', sphere_of_expertise: 'Engineering', seniority_level: 'Senior', languages: ['English'], industry: 'Technology', key_skills: ['Python'] };

    vi.mocked(callLLM).mockResolvedValue('```json\n' + JSON.stringify(mockResponse) + '\n```');

    const result = await extractCvCriteria('Sample CV text');
    expect(result.years_experience).toBe('5-9');
  });

  it('should retry on malformed JSON and succeed on second attempt', async () => {
    const validResponse = {
      years_experience: '5-9',
      education_level: 'Masters',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Senior',
      languages: ['English'],
      industry: 'Technology',
      key_skills: ['Python'],
    };

    vi.mocked(callLLM)
      .mockResolvedValueOnce('invalid json {')
      .mockResolvedValueOnce(JSON.stringify(validResponse));

    const result = await extractCvCriteria('Sample CV text');

    expect(result.years_experience).toBe('5-9');
    expect(callLLM).toHaveBeenCalledTimes(2);
  });

  it('should retry on timeout and throw LLMExtractionError after max retries', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';

    vi.mocked(callLLM).mockRejectedValue(abortError);

    await expect(extractCvCriteria('Sample CV text')).rejects.toThrow(LLMExtractionError);
    expect(callLLM).toHaveBeenCalledTimes(2);
  });

  it('should handle null values in LLM response', async () => {
    const mockResponse = {
      years_experience: null,
      education_level: null,
      field_of_study: null,
      sphere_of_expertise: null,
      seniority_level: 'Senior',
      languages: null,
      industry: 'Technology',
      key_skills: null,
    };

    vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockResponse));

    const result = await extractCvCriteria('Sample CV text');

    expect(result.years_experience).toBeNull();
    expect(result.education_level).toBeNull();
    expect(result.languages).toBeNull();
    expect(result.key_skills).toBeNull();
    expect(result.seniority_level).toBe('Senior');
  });
});
