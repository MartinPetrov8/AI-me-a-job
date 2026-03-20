import { execFile } from 'child_process';
import { promisify } from 'util';
import { RawJobPosting } from './types';

const execFileAsync = promisify(execFile);

export async function runPythonScraper(
  scriptPath: string,
  args?: string[]
): Promise<RawJobPosting[]> {
  try {
    const { stdout, stderr } = await execFileAsync(
      'python3',
      [scriptPath, ...(args || [])],
      {
        timeout: 120_000,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    if (stderr && stderr.trim()) {
      // Log stderr for debugging, but don't fail
      void stderr;
    }

    if (!stdout || stdout.trim() === '') {
      return [];
    }

    const parsed = JSON.parse(stdout);
    
    if (!Array.isArray(parsed)) {
      return [];
    }

    const jobs: RawJobPosting[] = [];
    for (const item of parsed) {
      if (!item.source || !item.title || !item.url) {
        continue;
      }

      jobs.push({
        external_id: item.external_id || `${item.source}-${Date.now()}`,
        source: item.source,
        title: item.title,
        company: item.company || null,
        location: item.location || null,
        country: item.country || null,
        url: item.url,
        description_raw: item.description || '',
        salary_min: item.salary_min || null,
        salary_max: item.salary_max || null,
        salary_currency: item.salary_currency || null,
        employment_type: item.employment_type || null,
        is_remote: item.remote !== undefined ? item.remote : null,
        posted_at: item.posted_at ? new Date(item.posted_at) : null,
      });
    }

    return jobs;
  } catch (err) {
    return [];
  }
}
