export const YEARS_EXPERIENCE = ['0-1', '2-4', '5-9', '10-15', '15+'] as const;
export type YearsExperience = typeof YEARS_EXPERIENCE[number];

export const EDUCATION_LEVELS = ['High school', 'Bachelors', 'Masters', 'PhD'] as const;
export type EducationLevel = typeof EDUCATION_LEVELS[number];

export const FIELDS_OF_STUDY = [
  'STEM',
  'Business & Economics',
  'Law',
  'Medicine & Health',
  'Social Sciences',
  'Humanities',
  'Arts & Design',
  'Education',
  'Agriculture & Environment',
  'Communications & Media',
  'Trades & Technical',
  'Other'
] as const;
export type FieldOfStudy = typeof FIELDS_OF_STUDY[number];

export const SPHERES_OF_EXPERTISE = [
  'Data Science',
  'Sales',
  'HR',
  'Engineering',
  'Marketing',
  'Finance',
  'Operations',
  'Product',
  'Design',
  'Legal',
  'Healthcare',
  'Education',
  'IT/DevOps',
  'Consulting',
  'Other'
] as const;
export type SphereOfExpertise = typeof SPHERES_OF_EXPERTISE[number];

export const SENIORITY_LEVELS = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead/Manager', 'Director+'] as const;
export type SeniorityLevel = typeof SENIORITY_LEVELS[number];

export const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Manufacturing',
  'Retail & E-commerce',
  'Consulting',
  'Telecom',
  'Energy',
  'Real Estate',
  'Government',
  'Education',
  'Media & Entertainment',
  'Logistics & Transport',
  'Hospitality',
  'Other'
] as const;
export type Industry = typeof INDUSTRIES[number];

export const WORK_MODES = ['Remote', 'Hybrid', 'On-site', 'Any'] as const;
export type WorkMode = typeof WORK_MODES[number];

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance'] as const;
export type EmploymentType = typeof EMPLOYMENT_TYPES[number];

export const JOB_SOURCES = ['adzuna', 'jooble', 'eures'] as const;
export type JobSource = typeof JOB_SOURCES[number];
