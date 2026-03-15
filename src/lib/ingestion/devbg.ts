import { RawJobPosting } from './types';
import crypto from 'crypto';

/**
 * Dev.bg scraper - Standard fetch (no Cloudflare)
 * Fetches IT jobs from dev.bg pages 1-3
 */
export async function fetchDevBgJobs(): Promise<RawJobPosting[]> {
  const jobs: RawJobPosting[] = [];

  try {
    for (let page = 1; page <= 3; page++) {
      const url = `https://dev.bg/jobs/?page=${page}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept-Language': 'bg,en',
        },
      });

      if (!response.ok) {
        console.warn(`[devbg] Failed to fetch page ${page}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      
      // Parse job listings - dev.bg uses job cards with specific structure
      // Using simple regex patterns (avoiding 's' flag for ES compatibility)
      const jobCardPattern = /<div class="job-card"[\s\S]*?<\/div>/gi;
      const jobMatches = html.match(jobCardPattern) || [];
      
      for (const jobHtml of jobMatches) {
        // Extract URL (contains numeric ID)
        const urlMatch = jobHtml.match(/href="(\/jobs\/\d+\/[^"]+)"/);
        if (!urlMatch) continue;
        
        const jobUrl = `https://dev.bg${urlMatch[1]}`;
        
        // Extract numeric ID from URL or use MD5 fallback
        const idMatch = jobUrl.match(/\/jobs\/(\d+)\//);
        const externalId = idMatch ? idMatch[1] : crypto.createHash('md5').update(jobUrl).digest('hex').substring(0, 16);
        
        // Extract title
        const titleMatch = jobHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled';
        
        // Extract company
        const companyMatch = jobHtml.match(/<div class="company"[^>]*>([\s\S]*?)<\/div>/i);
        const company = companyMatch ? companyMatch[1].replace(/<[^>]*>/g, '').trim() : null;
        
        // Extract location
        const locationMatch = jobHtml.match(/<div class="location"[^>]*>([\s\S]*?)<\/div>/i);
        const location = locationMatch ? locationMatch[1].replace(/<[^>]*>/g, '').trim() : null;
        
        // Extract description snippet
        const descMatch = jobHtml.match(/<div class="description"[^>]*>([\s\S]*?)<\/div>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        
        // Check for remote keywords
        const fullText = `${title} ${description}`.toLowerCase();
        const isRemote = fullText.includes('remote') || fullText.includes('дистанционно');
        
        jobs.push({
          external_id: externalId,
          source: 'dev_bg',
          title,
          company,
          location,
          country: 'bg',
          url: jobUrl,
          description_raw: description,
          salary_min: null,
          salary_max: null,
          salary_currency: null,
          employment_type: null,
          is_remote: isRemote,
          posted_at: null,
        });
      }
    }
    
    return jobs;
  } catch (error) {
    console.error('[devbg] Scraper error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}
