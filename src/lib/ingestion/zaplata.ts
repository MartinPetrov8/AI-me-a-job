import { runPythonScraper } from './python-runner';
import path from 'path';
import { RawJobPosting } from './types';

export async function fetchZaplataJobs(): Promise<RawJobPosting[]> {
  return runPythonScraper(path.join(process.cwd(), 'scripts/scrapers/zaplata_scraper.py'));
}
