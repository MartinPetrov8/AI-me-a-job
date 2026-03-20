import { runPythonScraper } from './python-runner';
import path from 'path';
import { RawJobPosting } from './types';

export async function fetchBulldogJobJobs(): Promise<RawJobPosting[]> {
  return runPythonScraper(path.join(process.cwd(), 'scripts/scrapers/bulldogjob_scraper.py'));
}
