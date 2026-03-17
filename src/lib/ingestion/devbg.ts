import { RawJobPosting } from './types';

/**
 * Dev.bg scraper
 * Fetches IT jobs from dev.bg category pages.
 *
 * Structure: each category page has up to ~20 job-list-item cards.
 * Cards include data-job-id (numeric), job URL, title, company, remote indicator.
 * We scrape 4 categories × 3 pages = up to 240 jobs per run.
 */

const DEVBG_CATEGORIES = [
  'back-end-development',
  'front-end-development',
  'full-stack-development',
  'data-science',
  'ml-ai-data',
  'devops',
  'it-management',
  'quality-assurance',
] as const;

const PAGES_PER_CATEGORY = 3;

// HTML entity decode helper — avoids dependency on 'he' if not installed
function decodeHtml(str: string): string {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function fetchDevBgJobs(): Promise<RawJobPosting[]> {
  const seen = new Set<string>();
  const jobs: RawJobPosting[] = [];

  for (const category of DEVBG_CATEGORIES) {
    for (let page = 1; page <= PAGES_PER_CATEGORY; page++) {
      const url = `https://dev.bg/company/jobs/${category}/${page > 1 ? `?fwp_paged=${page}` : ''}`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
            'Accept-Language': 'bg,en',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[devbg] Failed ${category} page ${page}: ${response.status}`);
          break; // No more pages in this category
        }

        const html = await response.text();
        const pageJobs = parseJobListItems(html);

        if (pageJobs.length === 0) {
          // Empty page — no more pages in this category
          break;
        }

        for (const job of pageJobs) {
          if (!seen.has(job.external_id)) {
            seen.add(job.external_id);
            jobs.push(job);
          }
        }

        console.log(`[devbg] ${category} page ${page}: ${pageJobs.length} jobs`);

        // Rate-limit: small delay between requests (skipped in test env)
        if (process.env.NODE_ENV !== 'test') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (err) {
        console.warn(`[devbg] Error fetching ${category} page ${page}: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
    }
  }

  console.log(`[devbg] Total unique jobs fetched: ${jobs.length}`);
  return jobs;
}

function parseJobListItems(html: string): RawJobPosting[] {
  const results: RawJobPosting[] = [];

  // Match each job-list-item block by data-job-id attribute
  // Pattern: <div class="job-list-item ... " data-job-id="NNNN" > ... </div></div></div>
  const blockPattern = /<div[^>]+class="job-list-item[^"]*"[^>]+data-job-id="(\d+)"[^>]*>([\s\S]*?)(?=<div[^>]+class="job-list-item|<\/div>\s*<\/div>\s*<\/div>\s*<(?:div|section|main|footer))/gi;

  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(html)) !== null) {
    const [, jobId, content] = match;

    // URL: overlay-link href
    const urlMatch = content.match(/href="(https:\/\/dev\.bg\/company\/jobads\/[^"]+)"/);
    if (!urlMatch) continue;
    const jobUrl = urlMatch[1];

    // Title: class="job-title..."
    const titleMatch = content.match(/class="job-title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h\d>/i);
    const title = titleMatch ? decodeHtml(stripTags(titleMatch[1])) : 'Untitled';

    // Company: class="company-name..."
    const companyMatch = content.match(/class="company-name[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/(?:span|div|a|h\d)>/i);
    const company = companyMatch ? decodeHtml(stripTags(companyMatch[1])) : null;

    // Location: class="..location.."
    const locationMatch = content.match(/class="[^"]*location[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/(?:span|div)>/i);
    const location = locationMatch ? decodeHtml(stripTags(locationMatch[1])) || null : null;

    // Remote: look for remote keyword in title/content
    const fullText = `${title} ${content}`.toLowerCase();
    const isRemote = fullText.includes('remote') ||
      fullText.includes('дистанционно') ||
      fullText.includes('work from home') ||
      content.includes('remote-badge') || null;

    results.push({
      external_id: `devbg-${jobId}`,
      source: 'dev_bg',
      title,
      company,
      location,
      country: 'bg',
      url: jobUrl,
      description_raw: '',  // Description only available on job detail page — skip for now
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      employment_type: null,
      is_remote: isRemote,
      posted_at: null,
    });
  }

  return results;
}
