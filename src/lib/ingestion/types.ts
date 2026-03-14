/**
 * Shared types for the job ingestion pipeline.
 * Used by Adzuna and Jooble clients + the orchestrator.
 */

export interface RawJobPosting {
  external_id: string;
  source: 'adzuna' | 'jooble' | 'reed' | 'jobs_bg' | 'dev_bg';
  title: string;
  company: string | null;
  location: string | null;
  country: string | null;
  url: string;
  description_raw: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  employment_type: string | null;
  is_remote: boolean | null;
  posted_at: Date | null;
}

export interface IngestionResult {
  source: string;
  fetched: number;
  new: number;
  errors: number;
  deleted: number;
}
