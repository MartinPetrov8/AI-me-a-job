-- Migration: 0003_dual_engine.sql
-- Add pgvector extension and embedding columns for hybrid scoring
-- Spec: SPEC-DUAL-ENGINE.md

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add embedding column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index on jobs.embedding for fast cosine similarity search
-- Only index jobs that have embeddings and are classified
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_embedding_hnsw_idx
  ON jobs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL AND classified_at IS NOT NULL;

-- SQL scoring indexes for structured pre-filter (Phase A)
-- These enable fast filtering on exact match criteria before vector re-ranking

-- Index on sphere of expertise for exact match filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_sphere_idx
  ON jobs (sphere_of_expertise)
  WHERE classified_at IS NOT NULL;

-- Index on seniority level for range matching
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_seniority_idx
  ON jobs (seniority_level)
  WHERE classified_at IS NOT NULL;

-- Index on industry for exact match filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_industry_idx
  ON jobs (industry)
  WHERE classified_at IS NOT NULL;

-- Index on remote flag for location preference filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_is_remote_idx
  ON jobs (is_remote)
  WHERE classified_at IS NOT NULL;

-- Composite index for classification time and posting date
-- Enables efficient sorting by recency in structured scoring phase
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_classified_posted_idx
  ON jobs (classified_at, posted_at DESC NULLS LAST)
  WHERE classified_at IS NOT NULL;
