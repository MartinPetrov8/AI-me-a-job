import { RawJobPosting } from './types';
import crypto from 'crypto';

/**
 * Jobs.bg scraper - Playwright stealth (Cloudflare bypass)
 * Fetches IT jobs from jobs.bg category 55 (IT), pages 1-2
 */
export async function fetchJobsBgJobs(): Promise<RawJobPosting[]> {
  try {
    // Dynamic import — fails gracefully in serverless (Playwright not available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playwright = await import('playwright' as any).catch(() => null);
    if (!playwright) return [];
    const { chromium } = playwright;
    
    const jobs: RawJobPosting[] = [];
    
    const browser = await chromium.launch({
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    try {
      for (let pageNum = 1; pageNum <= 2; pageNum++) {
        const url = `https://www.jobs.bg/front_job_search.php?categories[]=55&page=${pageNum}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for job listings to load
        await page.waitForSelector('.joblist', { timeout: 10000 }).catch(() => {
        });
        
        // Extract job data from page
        const pageJobs = await page.evaluate(() => {
          const jobElements = document.querySelectorAll('.joblist .job');
          const extracted: Array<{
            url: string;
            title: string;
            company: string | null;
            location: string | null;
            description: string;
          }> = [];
          
          jobElements.forEach((job) => {
            const linkEl = job.querySelector('a.job-link');
            const titleEl = job.querySelector('.job-title');
            const companyEl = job.querySelector('.company-name');
            const locationEl = job.querySelector('.location');
            const descEl = job.querySelector('.description');
            
            if (linkEl && titleEl) {
              extracted.push({
                url: (linkEl as HTMLAnchorElement).href,
                title: titleEl.textContent?.trim() || 'Untitled',
                company: companyEl?.textContent?.trim() || null,
                location: locationEl?.textContent?.trim() || null,
                description: descEl?.textContent?.trim() || '',
              });
            }
          });
          
          return extracted;
        });
        
        // Transform to RawJobPosting format
        for (const job of pageJobs) {
          const idMatch = job.url.match(/job_id=(\d+)/);
          const externalId = idMatch ? idMatch[1] : crypto.createHash('md5').update(job.url).digest('hex').substring(0, 16);
          
          const fullText = `${job.title} ${job.description}`.toLowerCase();
          const isRemote = fullText.includes('remote') || fullText.includes('дистанционно');
          
          jobs.push({
            external_id: externalId,
            source: 'jobs_bg',
            title: job.title,
            company: job.company,
            location: job.location,
            country: 'bg',
            url: job.url,
            description_raw: job.description,
            salary_min: null,
            salary_max: null,
            salary_currency: null,
            employment_type: null,
            is_remote: isRemote,
            posted_at: null,
          });
        }
      }
    } finally {
      await browser.close();
    }
    
    return jobs;
  } catch (error) {
    return [];
  }
}
