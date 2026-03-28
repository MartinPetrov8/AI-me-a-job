-- Migration: Switch from OpenAI (1536 dims) to Jina AI (768 dims)
-- Created: 2026-03-28

ALTER TABLE jobs DROP COLUMN IF EXISTS embedding;
ALTER TABLE jobs ADD COLUMN embedding vector(768);

ALTER TABLE profiles DROP COLUMN IF EXISTS embedding;
ALTER TABLE profiles ADD COLUMN embedding vector(768);

DROP INDEX IF EXISTS jobs_embedding_hnsw_idx;
CREATE INDEX jobs_embedding_hnsw_idx ON jobs USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
