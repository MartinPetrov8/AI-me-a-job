#!/usr/bin/env python3
"""Bulldogjob.com scraper — Poland's #3 IT job board.
Uses Fetcher (site is server-side rendered Next.js).
Cards use class="JobListItem_item__*" — each is an <a> tag.
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


def scrape_bulldogjob():
    jobs = []
    seen_urls = set()

    try:
        from scrapling import Fetcher, DynamicFetcher

        fetcher = Fetcher()
        dynamic_fetcher = None
        use_dynamic = False

        for page in range(1, 3):
            if len(jobs) >= 500:
                break

            url = (
                f"https://bulldogjob.com/companies/jobs?page={page}"
                if page > 1
                else "https://bulldogjob.com/companies/jobs"
            )

            try:
                if use_dynamic:
                    if not dynamic_fetcher:
                        dynamic_fetcher = DynamicFetcher()
                    response = dynamic_fetcher.fetch(url, headless=True, timeout=15000)
                else:
                    response = fetcher.get(url)

                if not response or response.status != 200:
                    if response and response.status == 403 and not use_dynamic:
                        print(
                            f"[bulldogjob] Blocked on page {page}, switching to DynamicFetcher",
                            file=sys.stderr,
                        )
                        use_dynamic = True
                        if not dynamic_fetcher:
                            dynamic_fetcher = DynamicFetcher()
                        response = dynamic_fetcher.fetch(url, headless=True, timeout=15000)
                        if not response or response.status != 200:
                            print(
                                f"[bulldogjob] DynamicFetcher also failed: {getattr(response, 'status', 'unknown')}",
                                file=sys.stderr,
                            )
                            break
                    else:
                        print(
                            f"[bulldogjob] HTTP {getattr(response, 'status', 'unknown')} for page {page}",
                            file=sys.stderr,
                        )
                        break

                content = response.html_content
                if not content:
                    print(f"[bulldogjob] Empty content for page {page}", file=sys.stderr)
                    break

                # Cards are <a class="JobListItem_item__*" href="https://bulldogjob.com/companies/jobs/...">
                card_pattern = (
                    r'<a\s+class="JobListItem_item__[^"]*"\s+'
                    r'href="(https://bulldogjob\.com/companies/jobs/[^"]+)">(.*?)</a>'
                )
                job_cards = re.findall(card_pattern, content, re.DOTALL)

                if not job_cards:
                    print(f"[bulldogjob] No job cards found on page {page}", file=sys.stderr)
                    break

                for job_url, card in job_cards:
                    try:
                        if job_url in seen_urls:
                            continue

                        # Title is in <h3>
                        title_m = re.search(r'<h3[^>]*>(.*?)</h3>', card, re.DOTALL)
                        if not title_m:
                            continue
                        title = decode_html_entities(
                            re.sub(r'<[^>]+>', '', title_m.group(1)).strip()
                        )
                        if not title:
                            continue

                        seen_urls.add(job_url)

                        # Company: <div class="text-xxs uppercase ... ">CompanyName</div>
                        company = None
                        company_m = re.search(
                            r'class="text-xxs uppercase[^"]*"[^>]*>(.*?)</div>',
                            card,
                            re.DOTALL,
                        )
                        if company_m:
                            company = decode_html_entities(
                                re.sub(r'<[^>]+>', '', company_m.group(1)).strip()
                            )

                        # Location: first <span class="text-xs"> inside the map-pin div
                        # The map-pin SVG always comes before the location span in the first child div
                        # of JobListItem_item__details.
                        # Contract type / employment type appear in later divs (items-start, hidden md:flex).
                        location = None
                        details_m = re.search(
                            r'JobListItem_item__details[^>]*><div[^>]*>(.*?)</div>',
                            card,
                            re.DOTALL,
                        )
                        if details_m:
                            first_div = details_m.group(1)
                            loc_m = re.search(
                                r'<span\s+class="text-xs">(.*?)</span>', first_div, re.DOTALL
                            )
                            if loc_m:
                                location = decode_html_entities(
                                    re.sub(r'<[^>]+>', '', loc_m.group(1)).strip()
                                )

                        # Remote detection
                        full_text = f"{title} {company or ''} {location or ''}".lower()
                        remote = 'remote' in full_text

                        # Salary (rarely present in list view)
                        salary_min = None
                        salary_max = None
                        salary_currency = None
                        sal_m = re.search(
                            r'(\d[\d\s,.]+)\s*[-–]\s*(\d[\d\s,.]+)\s*(PLN|EUR|USD)',
                            card,
                            re.IGNORECASE,
                        )
                        if sal_m:
                            try:
                                salary_min = int(re.sub(r'[^\d]', '', sal_m.group(1)))
                                salary_max = int(re.sub(r'[^\d]', '', sal_m.group(2)))
                                salary_currency = sal_m.group(3).upper()
                            except ValueError:
                                pass

                        # External ID from URL slug
                        job_id = job_url.rstrip('/').split('/')[-1].split('?')[0]
                        if not job_id:
                            job_id = str(abs(hash(job_url)))

                        jobs.append(
                            {
                                'source': 'bulldogjob',
                                'external_id': f'bulldogjob-{job_id}',
                                'title': title,
                                'company': company,
                                'location': location or 'Poland',
                                'url': job_url,
                                'description': '',
                                'posted_at': None,
                                'country': 'PL',
                                'remote': remote,
                                'salary_min': salary_min,
                                'salary_max': salary_max,
                                'salary_currency': salary_currency,
                                'employment_type': None,
                            }
                        )

                    except Exception as e:
                        print(f"[bulldogjob] Parse error: {e}", file=sys.stderr)
                        continue

                print(
                    f"[bulldogjob] page {page}: {len(job_cards)} cards found, {len(jobs)} jobs so far",
                    file=sys.stderr,
                )

                if page < 2:
                    time.sleep(random.uniform(2, 4))

            except Exception as e:
                print(f"[bulldogjob] Fetch error page {page}: {e}", file=sys.stderr)
                break

    except Exception as e:
        print(f"[bulldogjob] Init error: {e}", file=sys.stderr)

    print(json.dumps(jobs))


if __name__ == '__main__':
    scrape_bulldogjob()
