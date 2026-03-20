import { runPythonScraper } from './python-runner';
import path from 'path';
import { RawJobPosting } from './types';

export async function fetchJustJoinItJobs(): Promise<RawJobPosting[]> {
  return runPythonScraper(path.join(process.cwd(), 'scripts/scrapers/justjoinit_scraper.py'));
}
