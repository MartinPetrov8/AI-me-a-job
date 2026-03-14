import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test that the CV_EXTRACTION_SYSTEM_PROMPT explicitly instructs language extraction
import { CV_EXTRACTION_SYSTEM_PROMPT } from '@/lib/llm/prompts';

// Mock callLLM for extractCvCriteria tests
vi.mock('@/lib/llm/client', () => ({
  callLLM: vi.fn(),
}));

import { callLLM } from '@/lib/llm/client';
import { extractCvCriteria } from '@/lib/llm/extract-cv';

describe('CV languages extraction (Issue #19)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CV_EXTRACTION_SYSTEM_PROMPT explicitly mentions language extraction patterns', () => {
    // The prompt must guide the LLM to extract languages from natural language mentions
    expect(CV_EXTRACTION_SYSTEM_PROMPT).toContain('fluent in');
    expect(CV_EXTRACTION_SYSTEM_PROMPT).toContain('native speaker');
    expect(CV_EXTRACTION_SYSTEM_PROMPT).toContain('proficiency');
  });

  it('extractCvCriteria returns languages array when LLM returns them', async () => {
    vi.mocked(callLLM).mockResolvedValue(
      JSON.stringify({
        years_experience: '5-9',
        education_level: 'Masters',
        field_of_study: 'STEM',
        sphere_of_expertise: 'Data Science',
        seniority_level: 'Senior',
        languages: ['Bulgarian', 'English'],
        industry: 'Technology',
        key_skills: ['Python', 'SQL'],
      })
    );

    const result = await extractCvCriteria(
      'Data Scientist with 7 years experience. Languages: Bulgarian (native), English (C2).'
    );

    expect(result.languages).toEqual(['Bulgarian', 'English']);
  });

  it('extractCvCriteria returns null languages when LLM returns null', async () => {
    vi.mocked(callLLM).mockResolvedValue(
      JSON.stringify({
        years_experience: '2-4',
        education_level: 'Bachelors',
        field_of_study: 'STEM',
        sphere_of_expertise: 'Engineering',
        seniority_level: 'Mid',
        languages: null,
        industry: 'Technology',
        key_skills: ['TypeScript'],
      })
    );

    const result = await extractCvCriteria('Software Engineer with 3 years experience.');
    expect(result.languages).toBeNull();
  });
});
