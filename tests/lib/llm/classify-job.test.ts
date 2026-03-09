import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyJob } from '../../../src/lib/llm/classify-job';

vi.mock('../../../src/lib/llm/client', () => ({
  callLLM: vi.fn(),
  LLM_PROVIDER: 'anthropic',
  LLM_MODEL: 'claude-haiku-3-5-20241022',
}));

import { callLLM } from '../../../src/lib/llm/client';

describe('classifyJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns populated ClassifiedCriteria for job with clear qualifications', async () => {
    const mockPayload = {
      years_experience: '5-9',
      education_level: 'Bachelors',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Senior',
      languages: ['English', 'German'],
      industry: 'Technology',
      key_skills: ['TypeScript', 'React', 'Node.js'],
    };

    vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockPayload));

    const result = await classifyJob(
      'Senior Software Engineer',
      'We are looking for a Senior Software Engineer with 5+ years of experience in TypeScript and React...'
    );

    expect(result.years_experience).toBe('5-9');
    expect(result.education_level).toBe('Bachelors');
    expect(result.field_of_study).toBe('STEM');
    expect(result.sphere_of_expertise).toBe('Engineering');
    expect(result.seniority_level).toBe('Senior');
    expect(result.languages).toEqual(['English', 'German']);
    expect(result.industry).toBe('Technology');
    expect(result.key_skills).toEqual(['TypeScript', 'React', 'Node.js']);
  });

  it('sets field to null when LLM returns category not in bounded list', async () => {
    const mockPayload = {
      years_experience: 'invalid-range',
      education_level: 'PhD',
      field_of_study: 'InvalidField',
      sphere_of_expertise: 'Data Science',
      seniority_level: 'Mid',
      languages: ['English'],
      industry: 'InvalidIndustry',
      key_skills: ['Python'],
    };

    vi.mocked(callLLM).mockResolvedValue(JSON.stringify(mockPayload));

    const result = await classifyJob('Data Scientist', 'Looking for a mid-level data scientist...');

    expect(result.years_experience).toBeNull();
    expect(result.education_level).toBe('PhD');
    expect(result.field_of_study).toBeNull();
    expect(result.sphere_of_expertise).toBe('Data Science');
    expect(result.seniority_level).toBe('Mid');
    expect(result.languages).toEqual(['English']);
    expect(result.industry).toBeNull();
    expect(result.key_skills).toEqual(['Python']);
  });

  it('returns all null fields after timeout retries', async () => {
    const abortError = new Error('Request timed out');
    abortError.name = 'AbortError';

    vi.mocked(callLLM).mockRejectedValue(abortError);

    const result = await classifyJob('Software Engineer', 'Job description...');

    expect(result.years_experience).toBeNull();
    expect(result.education_level).toBeNull();
    expect(result.field_of_study).toBeNull();
    expect(result.sphere_of_expertise).toBeNull();
    expect(result.seniority_level).toBeNull();
    expect(result.languages).toBeNull();
    expect(result.industry).toBeNull();
    expect(result.key_skills).toBeNull();
  });
});
