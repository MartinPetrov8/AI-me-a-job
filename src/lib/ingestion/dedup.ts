import { createHash } from 'crypto';

/**
 * Normalize a job URL for cross-source deduplication.
 *
 * Strips UTM params, tracking tokens, and source-specific query params
 * so that the same ATS link (Greenhouse, Lever, Workday) from two
 * different job boards resolves to the same canonical URL.
 *
 * Returns null if the input is empty or not a valid URL.
 */
export function normalizeUrl(url: string): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());

    // Remove known tracking/UTM params
    const stripParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'source', 'src', 'from', 'via', 'referrer',
      'gh_src',           // Greenhouse
      'lever-origin',     // Lever
      'ss',               // SmartRecruiters
      'bid',              // Adzuna
      'jooble_id',        // Jooble
      'trk',              // LinkedIn
      'originalSubdomain', // LinkedIn
    ];

    for (const param of stripParams) {
      parsed.searchParams.delete(param);
    }

    // Lowercase hostname, remove trailing slash from pathname
    const normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;

    // Re-append any remaining (non-tracking) query params, sorted for determinism
    const remainingParams = parsed.searchParams.toString();
    return remainingParams ? `${normalized}?${remainingParams}` : normalized;

  } catch {
    // Not a valid URL — return null, no dedup by URL
    return null;
  }
}

/**
 * Compute a content fingerprint for cross-source deduplication.
 *
 * Uses MD5 of: lowercase(title) | lowercase(company) | lowercase(country) | ISO week
 * This catches the same job posted on multiple boards even when the URLs differ.
 *
 * ISO week format: "YYYY-Www" (e.g. "2026-W11")
 */
export function computeContentHash(
  title: string,
  company: string | null,
  country: string | null,
  postedAt: Date | null,
): string {
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedCompany = (company ?? '').toLowerCase().trim();
  const normalizedCountry = (country ?? '').toLowerCase().trim();

  // ISO week string: YYYY-Www
  const date = postedAt ?? new Date();
  const isoWeek = getISOWeekString(date);

  const fingerprint = `${normalizedTitle}|${normalizedCompany}|${normalizedCountry}|${isoWeek}`;

  return createHash('md5').update(fingerprint, 'utf8').digest('hex');
}

/**
 * Returns ISO 8601 week string: "YYYY-Www"
 * e.g. 2026-03-14 → "2026-W11"
 */
function getISOWeekString(date: Date): string {
  // Copy date to avoid mutation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday (ISO week starts Monday, Thursday determines the year)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}
