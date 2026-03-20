import { RawJobPosting } from './types';

interface NoFluffJobsPosting {
  id: string;
  title: string;
  name: string;
  location: {
    places?: { city?: string }[];
    fullyRemote?: boolean;
  };
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
  };
  posted?: string;
  url: string;
  technology?: string;
  seniority?: string[];
}

interface NoFluffJobsResponse {
  postings: NoFluffJobsPosting[];
  totalCount?: number;
  totalPages?: number;
}

export async function fetchNoFluffJobs(): Promise<RawJobPosting[]> {
  const allJobs: RawJobPosting[] = [];
  const seen = new Set<string>();
  const maxPages = 3;

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://nofluffjobs.com/api/posting?page=${page}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        break;
      }

      const data = (await response.json()) as NoFluffJobsResponse;

      if (!data.postings || data.postings.length === 0) {
        break;
      }

      for (const posting of data.postings) {
        const jobId = `nofluffjobs-${posting.id}`;
        if (seen.has(jobId)) continue;
        seen.add(jobId);

        const isRemote = posting.location?.fullyRemote ?? false;
        const location = isRemote
          ? 'Remote'
          : posting.location?.places?.[0]?.city || 'Poland';

        const description = [
          posting.title,
          posting.technology,
          posting.seniority?.join(', '),
        ]
          .filter(Boolean)
          .join(' — ');

        allJobs.push({
          external_id: jobId,
          source: 'nofluffjobs',
          title: posting.title,
          company: posting.name || null,
          location,
          country: 'PL',
          url: `https://nofluffjobs.com/job/${posting.url}`,
          description_raw: description,
          salary_min: posting.salary?.from || null,
          salary_max: posting.salary?.to || null,
          salary_currency: posting.salary?.currency || null,
          employment_type: null,
          is_remote: isRemote,
          posted_at: posting.posted ? new Date(posting.posted) : null,
        });
      }

      if (process.env.NODE_ENV !== 'test') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      break;
    }
  }

  return allJobs;
}
