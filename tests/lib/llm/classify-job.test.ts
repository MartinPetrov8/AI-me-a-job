import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyJob, JobClassificationError } from '../../../src/lib/llm/classify-job';
import * as client from '../../../src/lib/llm/client';

vi.mock('../../../src/lib/llm/client', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

describe('classifyJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns populated ClassifiedCriteria for job with clear qualifications', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              years_experience: '5-9',
              education_level: 'Bachelors',
              field_of_study: 'STEM',
              sphere_of_expertise: 'Engineering',
              seniority_level: 'Senior',
              languages: ['English', 'German'],
              industry: 'Technology',
              key_skills: ['TypeScript', 'React', 'Node.js'],
            }),
          },
        },
      ],
    };

    vi.mocked(client.openai.chat.completions.create).mockResolvedValue(mockResponse as any);

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
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              years_experience: 'invalid-range',
              education_level: 'PhD',
              field_of_study: 'InvalidField',
              sphere_of_expertise: 'Data Science',
              seniority_level: 'Mid',
              languages: ['English'],
              industry: 'InvalidIndustry',
              key_skills: ['Python'],
            }),
          },
        },
      ],
    };

    vi.mocked(client.openai.chat.completions.create).mockResolvedValue(mockResponse as any);

    const result = await classifyJob('Data Scientist', 'Looking for a mid-level data scientist...');

    expect(result.years_experience).toBe(null);
    expect(result.education_level).toBe('PhD');
    expect(result.field_of_study).toBe(null);
    expect(result.sphere_of_expertise).toBe('Data Science');
    expect(result.seniority_level).toBe('Mid');
    expect(result.languages).toEqual(['English']);
    expect(result.industry).toBe(null);
    expect(result.key_skills).toEqual(['Python']);
  });

  it('returns all null fields after timeout retries', async () => {
    const abortError = new Error('Request timed out');
    abortError.name = 'AbortError';

    vi.mocked(client.openai.chat.completions.create).mockRejectedValue(abortError);

    const result = await classifyJob('Software Engineer', 'Job description...');

    expect(result.years_experience).toBe(null);
    expect(result.education_level).toBe(null);
    expect(result.field_of_study).toBe(null);
    expect(result.sphere_of_expertise).toBe(null);
    expect(result.seniority_level).toBe(null);
    expect(result.languages).toBe(null);
    expect(result.industry).toBe(null);
    expect(result.key_skills).toBe(null);
  });
});
