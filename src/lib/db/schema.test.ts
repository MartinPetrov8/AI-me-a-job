import { describe, it, expect } from 'vitest';
import { jobs, profiles } from './schema';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Database schema pgvector support', () => {
  it('jobs table has embedding column with type PgVector', () => {
    expect(jobs.embedding).toBeDefined();
    expect(jobs.embedding.constructor.name).toBe('PgVector');
  });

  it('jobs.embedding has dimensions property set to 1536', () => {
    const embeddingConfig = (jobs.embedding as any).config;
    expect(embeddingConfig).toBeDefined();
    expect(embeddingConfig.dimensions).toBe(1536);
  });

  it('profiles table has embedding column with type PgVector', () => {
    expect(profiles.embedding).toBeDefined();
    expect(profiles.embedding.constructor.name).toBe('PgVector');
  });

  it('profiles.embedding has dimensions property set to 1536', () => {
    const embeddingConfig = (profiles.embedding as any).config;
    expect(embeddingConfig).toBeDefined();
    expect(embeddingConfig.dimensions).toBe(1536);
  });

  it('migration file 0003_dual_engine.sql exists and contains CREATE EXTENSION', () => {
    const migrationPath = join(__dirname, 'migrations', '0003_dual_engine.sql');
    const migrationContent = readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('CREATE EXTENSION IF NOT EXISTS vector');
  });

  it('migration file contains ALTER TABLE for jobs.embedding', () => {
    const migrationPath = join(__dirname, 'migrations', '0003_dual_engine.sql');
    const migrationContent = readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('ALTER TABLE jobs ADD COLUMN');
    expect(migrationContent).toContain('embedding vector(1536)');
  });

  it('migration file contains ALTER TABLE for profiles.embedding', () => {
    const migrationPath = join(__dirname, 'migrations', '0003_dual_engine.sql');
    const migrationContent = readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('ALTER TABLE profiles ADD COLUMN');
    expect(migrationContent).toContain('embedding vector(1536)');
  });

  it('migration file contains HNSW index on jobs.embedding', () => {
    const migrationPath = join(__dirname, 'migrations', '0003_dual_engine.sql');
    const migrationContent = readFileSync(migrationPath, 'utf-8');
    expect(migrationContent).toContain('CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_embedding_hnsw_idx');
    expect(migrationContent).toContain('USING hnsw');
    expect(migrationContent).toContain('vector_cosine_ops');
  });

  it('migration file contains all 5 SQL scoring indexes', () => {
    const migrationPath = join(__dirname, 'migrations', '0003_dual_engine.sql');
    const migrationContent = readFileSync(migrationPath, 'utf-8');
    
    expect(migrationContent).toContain('jobs_sphere_idx');
    expect(migrationContent).toContain('sphere_of_expertise');
    
    expect(migrationContent).toContain('jobs_seniority_idx');
    expect(migrationContent).toContain('seniority_level');
    
    expect(migrationContent).toContain('jobs_industry_idx');
    expect(migrationContent).toContain('industry');
    
    expect(migrationContent).toContain('jobs_is_remote_idx');
    expect(migrationContent).toContain('is_remote');
    
    expect(migrationContent).toContain('jobs_classified_posted_idx');
    expect(migrationContent).toContain('classified_at');
    expect(migrationContent).toContain('posted_at');
  });
});
