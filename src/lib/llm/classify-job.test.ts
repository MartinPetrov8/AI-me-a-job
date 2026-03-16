import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyJob } from './classify-job';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: mockCreate,
    };
  },
}));

describe('classifyJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should use Anthropic SDK with claude-haiku-4-5 model', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            years_experience: '2-4',
            education_level: 'Bachelors',
            field_of_study: 'STEM',
            sphere_of_expertise: 'Engineering',
            seniority_level: 'Mid',
            languages: ['English', 'Spanish'],
            industry: 'Technology',
            key_skills: ['Python', 'TypeScript'],
          }),
        },
      ],
    });

    const result = await classifyJob(
      'Senior Software Engineer',
      'We are looking for a senior engineer with 3+ years of experience in TypeScript and Python.'
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: expect.stringContaining('job posting classification assistant'),
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('Senior Software Engineer'),
          },
        ],
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );

    expect(result).toEqual({
      years_experience: '2-4',
      education_level: 'Bachelors',
      field_of_study: 'STEM',
      sphere_of_expertise: 'Engineering',
      seniority_level: 'Mid',
      languages: ['English', 'Spanish'],
      industry: 'Technology',
      key_skills: ['Python', 'TypeScript'],
    });
  });

  it('should throw error if ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      classifyJob('Test Job', 'Test description')
    ).rejects.toThrow('No LLM API key environment variable is set');
  });

  it('should handle JSON wrapped in markdown code fences', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '```json\n{"years_experience":"5-9","education_level":"Masters","field_of_study":"STEM","sphere_of_expertise":"Data Science","seniority_level":"Senior","languages":["English"],"industry":"Technology","key_skills":["Python","Machine Learning"]}\n```',
        },
      ],
    });

    const result = await classifyJob('Data Scientist', 'Looking for experienced ML engineer');

    expect(result.years_experience).toBe('5-9');
    expect(result.education_level).toBe('Masters');
  });

  it('should validate response against allowed values', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            years_experience: 'invalid',
            education_level: 'Bachelors',
            field_of_study: 'STEM',
            sphere_of_expertise: 'invalid_sphere',
            seniority_level: 'Mid',
            languages: ['English'],
            industry: 'Technology',
            key_skills: ['Python'],
          }),
        },
      ],
    });

    const result = await classifyJob('Test Job', 'Test description');

    expect(result.years_experience).toBeNull();
    expect(result.sphere_of_expertise).toBeNull();
    expect(result.education_level).toBe('Bachelors');
  });

  it('should return null fields on graceful degradation after retries', async () => {
    mockCreate.mockRejectedValue(new SyntaxError('Invalid JSON'));

    const result = await classifyJob('Test Job', 'Test description');

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      years_experience: null,
      education_level: null,
      field_of_study: null,
      sphere_of_expertise: null,
      seniority_level: null,
      languages: null,
      industry: null,
      key_skills: null,
    });
  });
});
