#!/usr/bin/env python3
"""BestJobs.eu scraper — Romania's #2 job board.
Uses DynamicFetcher (Playwright) — BestJobs is React SPA with lazy loading.
Uses general jobs listing URL (category filtering returns too few results).
Card structure: <a href="/en/job/slug"> + <h2>Title</h2> + <div class="...text-ink-medium">Company</div>
Outputs JSON array of job objects to stdout.
"""
import json
import random
import re
import sys
import time


def decode_html_entities(text):
    return (text
            .replace('&amp;', '&')
            .replace('&lt;', '<')
            .replace('&gt;', '>')
            .replace('&quot;', '"')
            .replace('&#x27;', "'")
            .replace('&#039;', "'"))


def scrape_bestjobs():
    jobs = []
    seen_urls = set()

    try:
        from scrapling import DynamicFetcher

        dynamic_fetcher = DynamicFetcher()

        # BestJobs category URLs return too few results (lazy loaded).
        # Use the general listing URL — returns ~24 jobs per page reliably.
        pages = [
            "https://www.bestjobs.eu/en/jobs-in-romania?page=1&per_page=20",
            "https://www.bestjobs.eu/en/jobs-in-romania?page=2&per_page=20",
        ]

        for url in pages:
            if len(jobs) >= 200:
                break

            try:
                response = dynamic_fetcher.fetch(url, headless=True, timeout=20000)

                if not response or response.status != 200:
                    print(
                        f"[bestjobs] HTTP {getattr(response, 'status', 'unknown')} for {url}",
                        file=sys.stderr,
                    )
                    continue

                content = response.html_content
                if not content:
                    print(f"[bestjobs] Empty content for {url}", file=sys.stderr)
                    continue

                # Extract job entries: each job has <a href="/en/job/slug"> + nearby <h2>Title</h2>
                # Pattern: job link has aria-label equal to title; h2 has the title text
                job_links = re.findall(r'href="(/en/job/[^"]+)"', content)
                title_blocks = re.findall(
                    r'<h2[^>]*class="[^"]*line-clamp-2[^"]*"[^>]*>(.*?)</h2>',
                    content,
                    re.DOTALL,
                )

                # Also try extracting company from text-ink-medium divs
                company_blocks = re.findall(
                    r'<div[^>]*class="[^"]*text-ink-medium[^"]*"[^>]*>(.*?)</div>',
                    content,
                    re.DOTALL,
                )

                job_count_before = len(jobs)

                # Pair links with titles (they should be in order)
                for i, job_path in enumerate(job_links):
                    job_url = f"https://www.bestjobs.eu{job_path}"
                    if job_url in seen_urls:
                        continue

                    title = ''
                    if i < len(title_blocks):
                        title = decode_html_entities(
                            re.sub(r'<[^>]+>', '', title_blocks[i]).strip()
                        )

                    if not title:
                        continue

                    seen_urls.add(job_url)

                    company = None
                    if i < len(company_blocks):
                        raw = decode_html_entities(
                            re.sub(r'<[^>]+>', '', company_blocks[i]).strip()
                        )
                        # Filter out obvious non-company values
                        if raw and len(raw) < 100 and '\n' not in raw:
                            company = raw

                    full_text = f"{title} {company or ''}".lower()
                    remote = 'remote' in full_text or 'work from home' in full_text

                    job_id = job_path.rstrip('/').split('/')[-1].split('?')[0]
                    if not job_id:
                        job_id = str(abs(hash(job_url)))

                    jobs.append({
                        'source': 'bestjobs',
                        'external_id': f'bestjobs-{job_id}',
                        'title': title,
                        'company': company,
                        'location': 'Romania',
                        'url': job_url,
                        'description': '',
                        'posted_at': None,
                        'country': 'RO',
                        'remote': remote,
                        'salary_min': None,
                        'salary_max': None,
                        'salary_currency': None,
                        'employment_type': None,
                    })

                added = len(jobs) - job_count_before
                print(
                    f"[bestjobs] {url}: {len(job_links)} links → {added} new jobs (total {len(jobs)})",
                    file=sys.stderr,
                )

                time.sleep(random.uniform(2, 4))

            except Exception as e:
                print(f"[bestjobs] Fetch error {url}: {e}", file=sys.stderr)
                continue

    except Exception as e:
        print(f"[bestjobs] Init error: {e}", file=sys.stderr)

    print(json.dumps(jobs))


if __name__ == '__main__':
    scrape_bestjobs()
