#!/usr/bin/env python3
"""JustJoin.it scraper — Poland's #1 IT job board.
API removed; uses DynamicFetcher + schema.org CollectionPage data.
Outputs JSON array of job objects to stdout.
"""
import json
import re
import sys

def scrape_justjoinit():
    jobs = []

    try:
        from scrapling import DynamicFetcher
        f = DynamicFetcher()
        r = f.fetch('https://justjoin.it/job-offers/all-locations', headless=True, timeout=20000)

        if not r or r.status != 200:
            print(f"[justjoinit] HTTP {getattr(r, 'status', 'unknown')}", file=sys.stderr)
            print(json.dumps([]))
            return

        content = r.html_content
        if not content:
            print("[justjoinit] Empty response", file=sys.stderr)
            print(json.dumps([]))
            return

        # Extract schema.org CollectionPage JSON from <script type="application/ld+json">
        ld_scripts = re.findall(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
            content, re.DOTALL
        )

        # Fallback: check all scripts for CollectionPage
        if not ld_scripts:
            ld_scripts = [s for s in re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
                         if 'CollectionPage' in s]

        job_urls = []
        for script_content in ld_scripts:
            if 'CollectionPage' not in script_content:
                continue
            try:
                data = json.loads(script_content)
                parts = data.get('hasPart', [])
                for part in parts:
                    url = part.get('url', '')
                    if url and '/job-offer/' in url:
                        job_urls.append(url)
            except json.JSONDecodeError:
                continue

        print(f"[justjoinit] Found {len(job_urls)} job URLs from schema.org", file=sys.stderr)

        for url in job_urls:
            try:
                # Extract slug from URL: https://justjoin.it/job-offer/company-title-city-tech
                slug = url.rstrip('/').split('/')[-1]
                parts = slug.split('-')

                # Best effort parse: company is usually first word(s), tech is last
                # This is approximate — full details need individual page fetch
                title = slug.replace('-', ' ').title()

                jobs.append({
                    'source': 'justjoinit',
                    'external_id': f'justjoinit-{slug}',
                    'title': title,
                    'company': None,  # Would need individual page fetch
                    'location': 'Poland',
                    'url': url,
                    'description': '',
                    'posted_at': None,
                    'country': 'PL',
                    'remote': False
                })
            except Exception as e:
                print(f"[justjoinit] Parse error: {e}", file=sys.stderr)
                continue

    except Exception as e:
        print(f"[justjoinit] Error: {e}", file=sys.stderr)

    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_justjoinit()
