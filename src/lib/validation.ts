import { z } from 'zod';
import {
  YEARS_EXPERIENCE,
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  SPHERES_OF_EXPERTISE,
  SENIORITY_LEVELS,
  INDUSTRIES,
  WORK_MODES,
  EMPLOYMENT_TYPES,
} from './criteria';

export const profileInputSchema = z.object({
  yearsExperience: z.enum(YEARS_EXPERIENCE),
  educationLevel: z.enum(EDUCATION_LEVELS),
  fieldOfStudy: z.enum(FIELDS_OF_STUDY),
  sphereOfExpertise: z.enum(SPHERES_OF_EXPERTISE),
  seniorityLevel: z.enum(SENIORITY_LEVELS),
  industry: z.enum(INDUSTRIES),
  languages: z.array(z.string()).min(1),
  keySkills: z.array(z.string()).min(1),
});

export const preferencesInputSchema = z.object({
  prefEmploymentType: z.array(z.enum(EMPLOYMENT_TYPES)).optional(),
  prefLocation: z.string().optional(),
  prefWorkMode: z.enum(WORK_MODES).optional(),
  prefRelocation: z.boolean().optional(),
  prefSalaryMin: z.number().int().positive().optional(),
  prefSalaryMax: z.number().int().positive().optional(),
  prefSalaryCurrency: z.string().optional(),
});
