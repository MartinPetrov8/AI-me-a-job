import { callLLM } from './client';
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
  if (typeof value !== 'string') return null;
  // Exact match first
  if (allowedValues.includes(value as T[number])) return value as T[number];
  // Case-insensitive match
  const lower = value.toLowerCase();
  const found = allowedValues.find(v => v.toLowerCase() === lower);
  if (found) return found;
  return null;
}

// Fuzzy normalisation maps — handles common LLM deviations from strict enum values
const SPHERE_ALIASES: Record<string, string> = {
  'software engineering': 'Engineering',
  'software development': 'Engineering',
  'web development': 'Engineering',
  'backend': 'Engineering',
  'frontend': 'Engineering',
  'full stack': 'Engineering',
  'fullstack': 'Engineering',
  'machine learning': 'Data Science',
  'artificial intelligence': 'Data Science',
  'data analytics': 'Data Science',
  'data analysis': 'Data Science',
  'data engineering': 'Data Science',
  'devops': 'IT/DevOps',
  'cloud': 'IT/DevOps',
  'infrastructure': 'IT/DevOps',
  'sre': 'IT/DevOps',
  'site reliability': 'IT/DevOps',
  'product management': 'Product',
  'project management': 'Operations',
  'business development': 'Sales',
  'account management': 'Sales',
  'human resources': 'HR',
  'people operations': 'HR',
  'talent acquisition': 'HR',
  'ux': 'Design',
  'ui': 'Design',
  'ux/ui': 'Design',
  'ui/ux': 'Design',
  'graphic design': 'Design',
  'accounting': 'Finance',
  'financial analysis': 'Finance',
  'investment': 'Finance',
  'supply chain': 'Operations',
  'logistics': 'Operations',
};

const INDUSTRY_ALIASES: Record<string, string> = {
  'tech': 'Technology',
  'software': 'Technology',
  'it': 'Technology',
  'information technology': 'Technology',
  'saas': 'Technology',
  'fintech': 'Finance & Banking',
  'banking': 'Finance & Banking',
  'financial services': 'Finance & Banking',
  'insurance': 'Finance & Banking',
  'pharma': 'Healthcare',
  'pharmaceutical': 'Healthcare',
  'biotech': 'Healthcare',
  'ecommerce': 'Retail & E-commerce',
  'e-commerce': 'Retail & E-commerce',
  'retail': 'Retail & E-commerce',
  'telecommunications': 'Telecom',
  'oil & gas': 'Energy',
  'renewable energy': 'Energy',
  'utilities': 'Energy',
  'transport': 'Logistics & Transport',
  'transportation': 'Logistics & Transport',
  'shipping': 'Logistics & Transport',
  'hotel': 'Hospitality',
  'travel': 'Hospitality',
  'tourism': 'Hospitality',
  'public sector': 'Government',
  'ngo': 'Government',
  'non-profit': 'Government',
  'advertising': 'Media & Entertainment',
  'marketing agency': 'Media & Entertainment',
  'media': 'Media & Entertainment',
  'gaming': 'Media & Entertainment',
};

const SENIORITY_ALIASES: Record<string, string> = {
  'junior': 'Junior',
  'associate': 'Junior',
  'graduate': 'Entry',
  'entry level': 'Entry',
  'entry-level': 'Entry',
  'intern': 'Entry',
  'internship': 'Entry',
  'mid-level': 'Mid',
  'mid level': 'Mid',
  'middle': 'Mid',
  'intermediate': 'Mid',
  'senior': 'Senior',
  'sr': 'Senior',
  'sr.': 'Senior',
  'staff': 'Senior',
  'principal': 'Lead/Manager',
  'lead': 'Lead/Manager',
  'manager': 'Lead/Manager',
  'team lead': 'Lead/Manager',
  'tech lead': 'Lead/Manager',
  'engineering manager': 'Lead/Manager',
  'director': 'Director+',
  'vp': 'Director+',
  'vice president': 'Director+',
  'cto': 'Director+',
  'ceo': 'Director+',
  'c-level': 'Director+',
  'head of': 'Director+',
};

function fuzzyNormalize<T extends readonly string[]>(
  value: unknown,
  allowedValues: T,
  aliases: Record<string, string>
): T[number] | null {
  const exact = validateValue(value, allowedValues);
  if (exact) return exact;
  if (typeof value !== 'string') return null;

  const lower = value.toLowerCase().trim();

  // Check alias map
  if (aliases[lower]) {
    const mapped = aliases[lower];
    if (allowedValues.includes(mapped as T[number])) return mapped as T[number];
  }

  // Partial match: check if any allowed value is contained in the input or vice versa
  for (const allowed of allowedValues) {
    const allowedLower = (allowed as string).toLowerCase();
    if (lower.includes(allowedLower) || allowedLower.includes(lower)) {
      return allowed;
    }
  }

  return null;
}

export async function extractCvCriteria(rawText: string): Promise<ExtractedCriteria> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const rawResponse = await callLLM(
        CV_EXTRACTION_SYSTEM_PROMPT,
        rawText,
        controller.signal
      );

      clearTimeout(timeoutId);

      // Strip markdown code fences if model wraps JSON
      const jsonText = rawResponse.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(jsonText);

      const validated: ExtractedCriteria = {
        years_experience: validateValue(parsed.years_experience, YEARS_EXPERIENCE),
        education_level: validateValue(parsed.education_level, EDUCATION_LEVELS),
        field_of_study: fuzzyNormalize(parsed.field_of_study, FIELDS_OF_STUDY, {}),
        sphere_of_expertise: fuzzyNormalize(parsed.sphere_of_expertise, SPHERES_OF_EXPERTISE, SPHERE_ALIASES),
        seniority_level: fuzzyNormalize(parsed.seniority_level, SENIORITY_LEVELS, SENIORITY_ALIASES),
        languages: Array.isArray(parsed.languages) ? parsed.languages : null,
        industry: fuzzyNormalize(parsed.industry, INDUSTRIES, INDUSTRY_ALIASES),
        key_skills: Array.isArray(parsed.key_skills) ? parsed.key_skills : null,
      };

      return validated;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        continue; // timeout — retry
      }

      if (error instanceof SyntaxError) {
        continue; // bad JSON — retry
      }

      throw error;
    }
  }

  throw new LLMExtractionError(
    `Failed to extract CV criteria after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
