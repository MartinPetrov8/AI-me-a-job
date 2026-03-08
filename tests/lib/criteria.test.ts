import { describe, it, expect } from 'vitest';
import {
  YEARS_EXPERIENCE,
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  SPHERES_OF_EXPERTISE,
  SENIORITY_LEVELS,
  INDUSTRIES,
  WORK_MODES,
  EMPLOYMENT_TYPES,
  JOB_SOURCES,
} from '../../src/lib/criteria';

describe('Criteria Constants', () => {
  it('YEARS_EXPERIENCE should be non-empty and have no duplicates', () => {
    expect(YEARS_EXPERIENCE.length).toBeGreaterThan(0);
    const uniqueValues = new Set(YEARS_EXPERIENCE);
    expect(uniqueValues.size).toBe(YEARS_EXPERIENCE.length);
  });

  it('EDUCATION_LEVELS should be non-empty and have no duplicates', () => {
    expect(EDUCATION_LEVELS.length).toBeGreaterThan(0);
    const uniqueValues = new Set(EDUCATION_LEVELS);
    expect(uniqueValues.size).toBe(EDUCATION_LEVELS.length);
  });

  it('FIELDS_OF_STUDY should be non-empty and have no duplicates', () => {
    expect(FIELDS_OF_STUDY.length).toBeGreaterThan(0);
    const uniqueValues = new Set(FIELDS_OF_STUDY);
    expect(uniqueValues.size).toBe(FIELDS_OF_STUDY.length);
  });

  it('SPHERES_OF_EXPERTISE should be non-empty and have no duplicates', () => {
    expect(SPHERES_OF_EXPERTISE.length).toBeGreaterThan(0);
    const uniqueValues = new Set(SPHERES_OF_EXPERTISE);
    expect(uniqueValues.size).toBe(SPHERES_OF_EXPERTISE.length);
  });

  it('SENIORITY_LEVELS should be non-empty and have no duplicates', () => {
    expect(SENIORITY_LEVELS.length).toBeGreaterThan(0);
    const uniqueValues = new Set(SENIORITY_LEVELS);
    expect(uniqueValues.size).toBe(SENIORITY_LEVELS.length);
  });

  it('INDUSTRIES should be non-empty and have no duplicates', () => {
    expect(INDUSTRIES.length).toBeGreaterThan(0);
    const uniqueValues = new Set(INDUSTRIES);
    expect(uniqueValues.size).toBe(INDUSTRIES.length);
  });

  it('WORK_MODES should be non-empty and have no duplicates', () => {
    expect(WORK_MODES.length).toBeGreaterThan(0);
    const uniqueValues = new Set(WORK_MODES);
    expect(uniqueValues.size).toBe(WORK_MODES.length);
  });

  it('EMPLOYMENT_TYPES should be non-empty and have no duplicates', () => {
    expect(EMPLOYMENT_TYPES.length).toBeGreaterThan(0);
    const uniqueValues = new Set(EMPLOYMENT_TYPES);
    expect(uniqueValues.size).toBe(EMPLOYMENT_TYPES.length);
  });

  it('JOB_SOURCES should be non-empty and have no duplicates', () => {
    expect(JOB_SOURCES.length).toBeGreaterThan(0);
    const uniqueValues = new Set(JOB_SOURCES);
    expect(uniqueValues.size).toBe(JOB_SOURCES.length);
  });
});
