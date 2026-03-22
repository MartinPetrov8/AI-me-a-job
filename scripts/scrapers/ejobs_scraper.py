#!/usr/bin/env python3
"""eJobs.ro scraper — Romania's #1 job board.
Uses DynamicFetcher (Playwright) — eJobs is a Nuxt SPA, no SSR job data.
Card structure: <h2 class="job-card-content-middle__title"><a href="/en/user/jobs/slug/ID">
Outputs JSON array of job objects to stdout.
"""
import json
import random
import re
import sys
import time
from datetime import datetime


def decode_html_entities(text):
    return (text
            .replace('&amp;', '&')
            .replace('&lt;', '<')
            .replace('&gt;', '>')
            .replace('&quot;', '"')
            .replace('&#x27;', "'")
            .replace('&#039;', "'"))


def scrape_ejobs():
    jobs = []
    seen_urls = set()

    categories = [
        'it-software',
        'engineering',
        'management',
    ]

    try:
        from scrapling import DynamicFetcher

        dynamic_fetcher = DynamicFetcher()

        for category in categories:
            if len(jobs) >= 500:
                break

            url = f"https://www.ejobs.ro/en/jobs/{category}"

            try:
                response = dynamic_fetcher.fetch(url, headless=True, timeout=20000)

                if not response or response.status != 200:
                    print(
                        f"[ejobs] HTTP {getattr(response, 'status', 'unknown')} for {category}",
                        file=sys.stderr,
                    )
                    continue

                content = response.html_content
                if not content:
                    print(f"[ejobs] Empty content for {category}", file=sys.stderr)
                    continue

                # Job cards: <div class="job-card-content-middle">
                #   <h2 class="job-card-content-middle__title"><a href="/en/user/jobs/slug/ID"><span>Title</span></a></h2>
                #   <h3 class="job-card-content-middle__info job-card-content-middle__info--darker"><a>Company</a></h3>
                #   <div class="job-card-content-middle__info">Location</div>
                card_blocks = re.findall(
                    r'<div class="job-card-content-middle">(.*?)</div>\s*<a href="/en/user/jobs/',
                    content,
                    re.DOTALL,
                )

                if not card_blocks:
                    # Fallback: extract from title links directly
                    job_links = re.findall(
                        r'<h2 class="job-card-content-middle__title">\s*'
                        r'<a href="(/en/user/jobs/[^"]+)"[^>]*>\s*<span>(.*?)</span>',
                        content,
                        re.DOTALL,
                    )

                    for job_path, raw_title in job_links:
                        job_url = f"https://www.ejobs.ro{job_path}"
                        if job_url in seen_urls:
                            continue
                        title = decode_html_entities(
                            re.sub(r'<[^>]+>', '', raw_title).strip()
                        )
                        if not title:
                            continue
                        seen_urls.add(job_url)
                        job_id = job_path.rstrip('/').split('/')[-1]
                        jobs.append({
                            'source': 'ejobs',
                            'external_id': f'ejobs-{job_id}',
                            'title': title,
                            'company': None,
                            'location': 'Romania',
                            'url': job_url,
                            'description': '',
                            'posted_at': None,
                            'country': 'RO',
                            'remote': 'remote' in title.lower(),
                            'salary_min': None,
                            'salary_max': None,
                            'salary_currency': None,
                            'employment_type': None,
                        })

                    print(
                        f"[ejobs] {category}: {len(job_links)} links (fallback mode)",
                        file=sys.stderr,
                    )
                    time.sleep(random.uniform(2, 4))
                    continue

                for block in card_blocks:
                    try:
                        title_m = re.search(
                            r'<a href="(/en/user/jobs/[^"]+)"[^>]*>\s*<span>(.*?)</span>',
                            block,
                            re.DOTALL,
                        )
                        if not title_m:
                            continue

                        job_path = title_m.group(1)
                        job_url = f"https://www.ejobs.ro{job_path}"
                        if job_url in seen_urls:
                            continue

                        title = decode_html_entities(
                            re.sub(r'<[^>]+>', '', title_m.group(2)).strip()
                        )
                        if not title:
                            continue

                        seen_urls.add(job_url)

                        company = None
                        comp_m = re.search(
                            r'job-card-content-middle__info--darker[^>]*>.*?<a[^>]*>(.*?)</a>',
                            block,
                            re.DOTALL,
                        )
                        if comp_m:
                            company = decode_html_entities(
                                re.sub(r'<[^>]+>', '', comp_m.group(1)).strip()
                            )

                        location = None
                        # Last <div class="job-card-content-middle__info"> (without --darker) has location
                        loc_matches = re.findall(
                            r'<div class="job-card-content-middle__info">(.*?)</div>',
                            block,
                            re.DOTALL,
                        )
                        if loc_matches:
                            location = decode_html_entities(
                                re.sub(r'<[^>]+>', '', loc_matches[-1]).strip()
                            )

                        full_text = f"{title} {company or ''} {location or ''}".lower()
                        remote = 'remote' in full_text or 'work from home' in full_text

                        sal_m = re.search(
                            r'(\d[\d\s,.]+)\s*[-–]\s*(\d[\d\s,.]+)\s*(RON|EUR|USD)',
                            block,
                            re.IGNORECASE,
                        )
                        salary_min = salary_max = salary_currency = None
                        if sal_m:
                            try:
                                salary_min = int(re.sub(r'[^\d]', '', sal_m.group(1)))
                                salary_max = int(re.sub(r'[^\d]', '', sal_m.group(2)))
                                salary_currency = sal_m.group(3).upper()
                            except ValueError:
                                pass

                        job_id = job_path.rstrip('/').split('/')[-1]

                        jobs.append({
                            'source': 'ejobs',
                            'external_id': f'ejobs-{job_id}',
                            'title': title,
                            'company': company,
                            'location': location or 'Romania',
                            'url': job_url,
                            'description': '',
                            'posted_at': None,
                            'country': 'RO',
                            'remote': remote,
                            'salary_min': salary_min,
                            'salary_max': salary_max,
                            'salary_currency': salary_currency,
                            'employment_type': None,
                        })

                    except Exception as e:
                        print(f"[ejobs] Parse error: {e}", file=sys.stderr)
                        continue

                print(
                    f"[ejobs] {category}: {len(card_blocks)} cards, {len(jobs)} jobs total",
                    file=sys.stderr,
                )
                time.sleep(random.uniform(2, 4))

            except Exception as e:
                print(f"[ejobs] Fetch error {category}: {e}", file=sys.stderr)
                continue

    except Exception as e:
        print(f"[ejobs] Init error: {e}", file=sys.stderr)

    print(json.dumps(jobs))


if __name__ == '__main__':
    scrape_ejobs()
