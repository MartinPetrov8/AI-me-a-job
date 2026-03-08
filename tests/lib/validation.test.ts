import { describe, it, expect } from 'vitest';
import { profileInputSchema, preferencesInputSchema } from '../../src/lib/validation';

describe('Profile Input Schema', () => {
  it('should accept valid profile input', () => {
    const validInput = {
      yearsExperience: '5-9',
      educationLevel: 'Bachelors',
      fieldOfStudy: 'STEM',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      languages: ['English', 'Spanish'],
      keySkills: ['JavaScript', 'React', 'Node.js'],
    };

    const result = profileInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid yearsExperience value', () => {
    const invalidInput = {
      yearsExperience: 'invalid-value',
      educationLevel: 'Bachelors',
      fieldOfStudy: 'STEM',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      languages: ['English'],
      keySkills: ['JavaScript'],
    };

    const result = profileInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject invalid educationLevel value', () => {
    const invalidInput = {
      yearsExperience: '5-9',
      educationLevel: 'NotADegree',
      fieldOfStudy: 'STEM',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      languages: ['English'],
      keySkills: ['JavaScript'],
    };

    const result = profileInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject missing required field', () => {
    const invalidInput = {
      yearsExperience: '5-9',
      educationLevel: 'Bachelors',
      // Missing fieldOfStudy
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      languages: ['English'],
      keySkills: ['JavaScript'],
    };

    const result = profileInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty languages array', () => {
    const invalidInput = {
      yearsExperience: '5-9',
      educationLevel: 'Bachelors',
      fieldOfStudy: 'STEM',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      languages: [],
      keySkills: ['JavaScript'],
    };

    const result = profileInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject empty keySkills array', () => {
    const invalidInput = {
      yearsExperience: '5-9',
      educationLevel: 'Bachelors',
      fieldOfStudy: 'STEM',
      sphereOfExpertise: 'Engineering',
      seniorityLevel: 'Senior',
      industry: 'Technology',
      languages: ['English'],
      keySkills: [],
    };

    const result = profileInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});

describe('Preferences Input Schema', () => {
  it('should accept valid preferences with all optional fields', () => {
    const validInput = {
      prefEmploymentType: ['Full-time', 'Part-time'],
      prefLocation: 'Remote',
      prefWorkMode: 'Remote',
      prefRelocation: true,
      prefSalaryMin: 80000,
      prefSalaryMax: 120000,
      prefSalaryCurrency: 'USD',
    };

    const result = preferencesInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should accept empty preferences object', () => {
    const emptyInput = {};
    const result = preferencesInputSchema.safeParse(emptyInput);
    expect(result.success).toBe(true);
  });

  it('should accept partial preferences', () => {
    const partialInput = {
      prefWorkMode: 'Hybrid',
      prefSalaryMin: 60000,
    };

    const result = preferencesInputSchema.safeParse(partialInput);
    expect(result.success).toBe(true);
  });

  it('should reject invalid prefWorkMode value', () => {
    const invalidInput = {
      prefWorkMode: 'InvalidMode',
    };

    const result = preferencesInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject negative salary values', () => {
    const invalidInput = {
      prefSalaryMin: -1000,
    };

    const result = preferencesInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer salary values', () => {
    const invalidInput = {
      prefSalaryMin: 50000.5,
    };

    const result = preferencesInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
