import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractCvCriteria, LLMExtractionError } from '@/lib/llm/extract-cv';
import * as clientModule from '@/lib/llm/client';

describe('extractCvCriteria', () => {
  let mockCreate: any;

  beforeEach(() => {
    mockCreate = vi.fn();
    vi.spyOn(clientModule.openai.chat.completions, 'create').mockImplementation(mockCreate);
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
      key_skills: ['Python', 'Go', 'Kubernetes']
    };

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify(mockResponse)
        }
      }]
    });

    const result = await extractCvCriteria('Sample CV text');

    expect(result).toEqual(mockResponse);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' }
      }),
      expect.any(Object)
    );
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
      key_skills: ['Python']
    };

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify(mockResponse)
        }
      }]
    });

    const result = await extractCvCriteria('Sample CV text');

    expect(result.years_experience).toBeNull();
    expect(result.education_level).toBeNull();
    expect(result.sphere_of_expertise).toBeNull();
    expect(result.field_of_study).toBe('STEM');
    expect(result.seniority_level).toBe('Senior');
  });

  it('should retry on malformed JSON and succeed on second attempt', async () => {
    mockCreate
      .mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'invalid json {'
          }
        }]
      })
      .mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              years_experience: '5-9',
              education_level: 'Masters',
              field_of_study: 'STEM',
              sphere_of_expertise: 'Engineering',
              seniority_level: 'Senior',
              languages: ['English'],
              industry: 'Technology',
              key_skills: ['Python']
            })
          }
        }]
      });

    const result = await extractCvCriteria('Sample CV text');

    expect(result.years_experience).toBe('5-9');
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should retry on timeout and throw after max retries', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    
    mockCreate.mockRejectedValue(abortError);

    await expect(extractCvCriteria('Sample CV text')).rejects.toThrow(LLMExtractionError);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it('should handle null values in response', async () => {
    const mockResponse = {
      years_experience: null,
      education_level: null,
      field_of_study: null,
      sphere_of_expertise: null,
      seniority_level: 'Senior',
      languages: null,
      industry: 'Technology',
      key_skills: null
    };

    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify(mockResponse)
        }
      }]
    });

    const result = await extractCvCriteria('Sample CV text');

    expect(result.years_experience).toBeNull();
    expect(result.education_level).toBeNull();
    expect(result.languages).toBeNull();
    expect(result.key_skills).toBeNull();
    expect(result.seniority_level).toBe('Senior');
  });
});
