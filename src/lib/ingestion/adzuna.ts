import { RawJobPosting } from './types';

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  redirect_url: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  created: string;
  category?: { tag?: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

const ADZUNA_COUNTRIES = ['gb', 'us', 'de', 'fr', 'nl', 'bg', 'pl', 'au'] as const;

// Targeted search queries covering all spheres we match against
const ADZUNA_QUERIES = [
  'data scientist',
  'data analyst',
  'machine learning engineer',
  'data engineer',
  'analytics manager',
  'software engineer',
  'product manager',
  'devops engineer',
  'finance analyst',
  'marketing manager',
  'sales manager',
  'hr manager',
  'operations manager',
  'consultant',
] as const;

export async function fetchAdzunaJobs(
  country: string,
  page: number = 1,
  query: string = '',
  maxDaysOld?: number   // when set, fetches only jobs newer than N days (incremental mode)
): Promise<RawJobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return [];
  }

  const queryParam = query ? `&what=${encodeURIComponent(query)}` : '';
  const freshnessParam = maxDaysOld ? `&max_days_old=${maxDaysOld}&sort_by=date` : '';
  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=50${queryParam}${freshnessParam}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[adzuna] ${country} page ${page}: HTTP ${res.status}`);
      return [];
    }

    const data = (await res.json()) as AdzunaResponse;

    const currencyMap: Record<string, string> = {
      us: 'USD',
      gb: 'GBP',
      au: 'AUD',
      de: 'EUR',
      fr: 'EUR',
      nl: 'EUR',
      bg: 'BGN',
      pl: 'PLN',
    };

    return (data.results ?? []).map((job): RawJobPosting => ({
      external_id: String(job.id),
      source: 'adzuna',
      title: job.title,
      company: job.company?.display_name ?? null,
      location: job.location?.display_name ?? null,
      country: country,
      url: job.redirect_url,
      description_raw: job.description,
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
      salary_currency: currencyMap[country] ?? 'EUR',
      employment_type: job.contract_type ?? null,
      is_remote: null,
      posted_at: job.created ? new Date(job.created) : null,
    }));
  } catch (err) {
    console.error(`[adzuna] ${country} page ${page}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export { ADZUNA_COUNTRIES, ADZUNA_QUERIES };

// Countries covered for all Adzuna runs
const ACTIVE_COUNTRIES = ['gb', 'us', 'de', 'fr', 'nl', 'pl'] as const;

/**
 * DAILY INCREMENTAL: fetch only jobs posted in the last 2 days.
 * ~1-3 API calls per country/query combo (most will return 0-1 pages of new results).
 * Typical daily budget: ~50-100 calls total across all countries + queries.
 */
export async function fetchIncrementalAdzunaJobs(): Promise<RawJobPosting[]> {
  const all: RawJobPosting[] = [];
  const seen = new Set<string>();

  for (const country of ACTIVE_COUNTRIES) {
    for (const query of ADZUNA_QUERIES) {
      // Fetch page 1 only — if there are >50 new jobs for one query in one country in a day,
      // that's extremely unlikely; page 2 would just waste calls.
      const batch = await fetchAdzunaJobs(country, 1, query, 2);
      for (const job of batch) {
        if (!seen.has(job.external_id)) {
          seen.add(job.external_id);
          all.push(job);
        }
      }
    }
  }

  return all;
}

/**
 * WEEKLY FULL BACKFILL: fetch all jobs (no date filter), multiple pages per query.
 * Used for initial load and weekly re-sync to catch anything missed incrementally.
 * ~168 calls (6 countries × 14 queries × 2 pages = 168). Runs once per week.
 */
export async function fetchAllAdzunaJobs(): Promise<RawJobPosting[]> {
  const all: RawJobPosting[] = [];
  const seen = new Set<string>();

  for (const country of ACTIVE_COUNTRIES) {
    for (const query of ADZUNA_QUERIES) {
      // Fetch 2 pages (100 jobs) per country/query — good depth without burning quota
      for (const page of [1, 2]) {
        const batch = await fetchAdzunaJobs(country, page, query);
        if (batch.length === 0) break; // no more results for this query/country
        for (const job of batch) {
          if (!seen.has(job.external_id)) {
            seen.add(job.external_id);
            all.push(job);
          }
        }
      }
    }
  }

  return all;
}
