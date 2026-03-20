import { runPythonScraper } from './python-runner';
import path from 'path';
import { RawJobPosting } from './types';

export async function fetchEJobsJobs(): Promise<RawJobPosting[]> {
  return runPythonScraper(path.join(process.cwd(), 'scripts/scrapers/ejobs_scraper.py'));
}
