import { runPythonScraper } from './python-runner';
import path from 'path';
import { RawJobPosting } from './types';

export async function fetchBestJobsJobs(): Promise<RawJobPosting[]> {
  return runPythonScraper(path.join(process.cwd(), 'scripts/scrapers/bestjobs_scraper.py'));
}
