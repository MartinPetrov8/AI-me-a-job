import { RawJobPosting } from './types';

const WWR_CATEGORIES = [
  'remote-programming-jobs',
  'remote-devops-sysadmin-jobs',
  'remote-data-jobs',
  'remote-product-jobs',
] as const;

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

function parseTitle(rawTitle: string): { company: string | null; title: string } {
  const colonIndex = rawTitle.indexOf(':');
  if (colonIndex === -1) {
    return { company: null, title: rawTitle.trim() };
  }
  return {
    company: rawTitle.substring(0, colonIndex).trim(),
    title: rawTitle.substring(colonIndex + 1).trim(),
  };
}

function parseRssXml(xml: string): RawJobPosting[] {
  const jobs: RawJobPosting[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;

  let match: RegExpExecArray | null;
  while ((match = itemPattern.exec(xml)) !== null) {
    const itemContent = match[1];

    const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);

    if (!titleMatch || !linkMatch) continue;

    const rawTitle = titleMatch[1].trim();
    const { company, title } = parseTitle(rawTitle);
    const url = linkMatch[1].trim();
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : null;
    const description = descMatch ? stripTags(descMatch[1]) : '';

    const uniqueId = url.split('/').pop() || url;

    jobs.push({
      external_id: `weworkremotely-${uniqueId}`,
      source: 'weworkremotely',
      title,
      company,
      location: 'Remote',
      country: 'REMOTE',
      url,
      description_raw: description,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      is_remote: true,
      posted_at: pubDate ? new Date(pubDate) : null,
    });
  }

  return jobs;
}

export async function fetchWeWorkRemotelyJobs(): Promise<RawJobPosting[]> {
  const allJobs: RawJobPosting[] = [];
  const seen = new Set<string>();

  for (const category of WWR_CATEGORIES) {
    const url = `https://weworkremotely.com/categories/${category}.rss`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        continue;
      }

      const xml = await response.text();
      const jobs = parseRssXml(xml);

      for (const job of jobs) {
        if (!seen.has(job.external_id)) {
          seen.add(job.external_id);
          allJobs.push(job);
        }
      }

      if (process.env.NODE_ENV !== 'test') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      continue;
    }
  }

  return allJobs;
}
