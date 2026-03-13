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

const ADZUNA_COUNTRIES = ['gb', 'us', 'de', 'fr', 'nl', 'au'] as const;

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
  query: string = ''
): Promise<RawJobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error('[adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY');
    return [];
  }

  const queryParam = query ? `&what=${encodeURIComponent(query)}` : '';
  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=50${queryParam}`;

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
      salary_currency: country === 'us' ? 'USD' : country === 'gb' || country === 'au' ? (country === 'gb' ? 'GBP' : 'AUD') : 'EUR',
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

export async function fetchAllAdzunaJobs(): Promise<RawJobPosting[]> {
  const all: RawJobPosting[] = [];
  const seen = new Set<string>();

  // Sample 3 countries × all queries (keeps API usage reasonable while covering all spheres)
  const countries: typeof ADZUNA_COUNTRIES[number][] = ['gb', 'us', 'de'];

  for (const country of countries) {
    for (const query of ADZUNA_QUERIES) {
      console.log(`[adzuna] Fetching "${query}" in ${country}...`);
      const jobs = await fetchAdzunaJobs(country, 1, query);
      // Deduplicate by external_id
      for (const job of jobs) {
        if (!seen.has(job.external_id)) {
          seen.add(job.external_id);
          all.push(job);
        }
      }
    }
  }

  console.log(`[adzuna] Total unique jobs fetched: ${all.length}`);
  return all;
}
