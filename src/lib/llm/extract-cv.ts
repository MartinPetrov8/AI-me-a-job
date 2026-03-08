import { openai } from './client';
import { CV_EXTRACTION_SYSTEM_PROMPT } from './prompts';
import {
  YEARS_EXPERIENCE,
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  SPHERES_OF_EXPERTISE,
  SENIORITY_LEVELS,
  INDUSTRIES,
  type YearsExperience,
  type EducationLevel,
  type FieldOfStudy,
  type SphereOfExpertise,
  type SeniorityLevel,
  type Industry,
} from '../criteria';

export interface ExtractedCriteria {
  years_experience: YearsExperience | null;
  education_level: EducationLevel | null;
  field_of_study: FieldOfStudy | null;
  sphere_of_expertise: SphereOfExpertise | null;
  seniority_level: SeniorityLevel | null;
  languages: string[] | null;
  industry: Industry | null;
  key_skills: string[] | null;
}

export class LLMExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMExtractionError';
  }
}

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

function validateValue<T extends readonly string[]>(
  value: unknown,
  allowedValues: T
): T[number] | null {
  if (typeof value === 'string' && allowedValues.includes(value as T[number])) {
    return value as T[number];
  }
  return null;
}

export async function extractCvCriteria(rawText: string): Promise<ExtractedCriteria> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: CV_EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: rawText },
          ],
          response_format: { type: 'json_object' },
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new LLMExtractionError('No content in LLM response');
      }

      const parsed = JSON.parse(content);

      const validated: ExtractedCriteria = {
        years_experience: validateValue(parsed.years_experience, YEARS_EXPERIENCE),
        education_level: validateValue(parsed.education_level, EDUCATION_LEVELS),
        field_of_study: validateValue(parsed.field_of_study, FIELDS_OF_STUDY),
        sphere_of_expertise: validateValue(parsed.sphere_of_expertise, SPHERES_OF_EXPERTISE),
        seniority_level: validateValue(parsed.seniority_level, SENIORITY_LEVELS),
        languages: Array.isArray(parsed.languages) ? parsed.languages : null,
        industry: validateValue(parsed.industry, INDUSTRIES),
        key_skills: Array.isArray(parsed.key_skills) ? parsed.key_skills : null,
      };

      return validated;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof Error && error.name === 'AbortError') {
        continue;
      }
      
      if (error instanceof SyntaxError) {
        continue;
      }
      
      throw error;
    }
  }

  throw new LLMExtractionError(
    `Failed to extract CV criteria after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
