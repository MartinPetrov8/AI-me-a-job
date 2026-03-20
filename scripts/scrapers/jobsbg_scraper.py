#!/usr/bin/env python3
"""Jobs.bg scraper — Bulgaria's #1 job board.
KNOWN ISSUE: jobs.bg uses DataDome CAPTCHA + Cloudflare.
Cannot be scraped from datacenter IPs. Returns empty array gracefully.
Will work when run from residential IP (e.g., Martin's local machine).
Outputs JSON array of job objects to stdout.
"""
import json
import random
import re
import sys
import time

def scrape_jobs_bg():
    jobs = []

    try:
        # Try DynamicFetcher first (Playwright), then StealthyFetcher
        fetcher = None
        fetch_func = None

        try:
            from scrapling import DynamicFetcher
            fetcher = DynamicFetcher()
            fetch_func = lambda url: fetcher.fetch(url, headless=True, timeout=15000)
            print("[jobsbg] Using DynamicFetcher", file=sys.stderr)
        except Exception:
            try:
                from scrapling import StealthyFetcher
                fetcher = StealthyFetcher()
                fetch_func = lambda url: fetcher.fetch(url)
                print("[jobsbg] Using StealthyFetcher", file=sys.stderr)
            except Exception as e:
                print(f"[jobsbg] No fetcher available: {e}", file=sys.stderr)
                print(json.dumps([]))
                return

        base_url = 'https://www.jobs.bg/front_job_search.php?categories[]=56'

        for page in range(1, 4):
            url = f"{base_url}&page={page}" if page > 1 else base_url

            try:
                response = fetch_func(url)

                if not response:
                    print(f"[jobsbg] Page {page}: no response", file=sys.stderr)
                    break

                status = getattr(response, 'status', 0)
                if status == 403:
                    print(f"[jobsbg] Page {page}: 403 Forbidden (DataDome/Cloudflare)", file=sys.stderr)
                    break

                if status != 200:
                    print(f"[jobsbg] Page {page}: HTTP {status}", file=sys.stderr)
                    break

                content = response.html_content
                if not content or 'captcha-delivery.com' in content:
                    print(f"[jobsbg] Page {page}: CAPTCHA challenge detected", file=sys.stderr)
                    break

                # Parse job listings — jobs.bg uses <a> tags with href="/front_job_view.php?..."
                job_links = re.findall(
                    r'<a[^>]*href="(/front_job_view\.php\?frompage=[^"]*id=(\d+)[^"]*)"[^>]*>(.*?)</a>',
                    content, re.DOTALL
                )

                if not job_links:
                    # Try alternative pattern
                    job_links = re.findall(
                        r'href="(https?://www\.jobs\.bg/front_job_view\.php[^"]*id=(\d+)[^"]*)"',
                        content
                    )

                if not job_links:
                    print(f"[jobsbg] Page {page}: no job links found", file=sys.stderr)
                    break

                print(f"[jobsbg] Page {page}: {len(job_links)} links found", file=sys.stderr)

                for match in job_links:
                    try:
                        if len(match) >= 3:
                            href, job_id, title_html = match
                            title = re.sub(r'<[^>]+>', '', title_html).strip()
                        else:
                            href, job_id = match[0], match[1]
                            title = ''

                        job_url = href if href.startswith('http') else f'https://www.jobs.bg{href}'

                        if not title or not job_url:
                            continue

                        jobs.append({
                            'source': 'jobs_bg',
                            'external_id': f'jobsbg-{job_id}',
                            'title': title,
                            'company': None,
                            'location': 'Bulgaria',
                            'url': job_url,
                            'description': '',
                            'posted_at': None,
                            'country': 'BG',
                            'remote': False
                        })
                    except Exception:
                        continue

                if page < 3:
                    time.sleep(random.uniform(2, 5))

            except Exception as e:
                print(f"[jobsbg] Page {page} error: {e}", file=sys.stderr)
                break

    except Exception as e:
        print(f"[jobsbg] Fatal: {e}", file=sys.stderr)

    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_jobs_bg()
