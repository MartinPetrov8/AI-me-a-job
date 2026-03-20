#!/usr/bin/env python3
"""Zaplata.bg scraper — Bulgaria salary-focused job board.
Uses Scrapling StealthyFetcher for anti-bot bypass.
Outputs JSON array of job objects to stdout.
"""
import json
import random
import re
import sys
import time
from scrapling import StealthyFetcher

def scrape_zaplata():
    jobs = []
    base_url = 'https://www.zaplata.bg/en/it/'

    try:
        fetcher = StealthyFetcher()

        for page in range(1, 4):  # 3 pages
            url = f"{base_url}?page={page}" if page > 1 else base_url

            try:
                response = fetcher.fetch(url)

                if not response or response.status != 200:
                    print(f"[zaplata] Page {page}: HTTP {getattr(response, 'status', 'unknown')}", file=sys.stderr)
                    break

                content = response.html_content
                if not content:
                    break

                # Job cards are <item> tags inside <items> container
                # Structure: <item data-page="N"><div class="grid">...</div></item>
                items = re.findall(r'<item\s+data-page="[^"]*">(.*?)</item>', content, re.DOTALL)

                if not items:
                    print(f"[zaplata] Page {page}: no items found", file=sys.stderr)
                    break

                for item_html in items:
                    try:
                        # Title: <div class="title" id="tNNNNNN"><a href="...">Title</a></div>
                        title_match = re.search(r'<div\s+class="title"[^>]*>\s*<a\s+href="([^"]+)"[^>]*>(.*?)</a>', item_html, re.DOTALL)
                        if not title_match:
                            continue

                        job_url = title_match.group(1).strip()
                        title = re.sub(r'<[^>]+>', '', title_match.group(2)).strip()

                        if not title or not job_url:
                            continue

                        # Company: <div class="company"><a href="...">Company Name</a></div>
                        company = ''
                        company_match = re.search(r'<div\s+class="company">\s*<a[^>]*>(.*?)</a>', item_html, re.DOTALL)
                        if company_match:
                            company = re.sub(r'<[^>]+>', '', company_match.group(1)).strip()

                        # Location + date: <div class="city"><strong>City</strong> / DD Month</div>
                        location = ''
                        city_match = re.search(r'<div\s+class="city">\s*<strong>(.*?)</strong>', item_html, re.DOTALL)
                        if city_match:
                            location = re.sub(r'<[^>]+>', '', city_match.group(1)).strip()

                        # Salary: <div class="salary">...<strong>FROM</strong> to <strong>TO €</strong>...</div>
                        salary_text = ''
                        salary_match = re.search(r'<div\s+class="salary">(.*?)</div>', item_html, re.DOTALL)
                        if salary_match:
                            salary_raw = re.sub(r'<[^>]+>', '', salary_match.group(1)).strip()
                            salary_raw = re.sub(r'\s+', ' ', salary_raw).strip()
                            # Remove the logo reference
                            salary_text = salary_raw.replace('\n', ' ').strip()

                        # Job ID from attr-id
                        id_match = re.search(r'attr-id="(\d+)"', item_html)
                        job_id = id_match.group(1) if id_match else str(abs(hash(job_url)))

                        description = f"Salary: {salary_text}" if salary_text else ''
                        full_text = f"{title} {description} {location}".lower()
                        remote = 'remote' in full_text or 'дистанционно' in full_text or 'от вкъщи' in full_text

                        jobs.append({
                            'source': 'zaplata',
                            'external_id': f'zaplata-{job_id}',
                            'title': title,
                            'company': company or None,
                            'location': location or 'Bulgaria',
                            'url': job_url,
                            'description': description,
                            'posted_at': None,
                            'country': 'BG',
                            'remote': remote
                        })
                    except Exception as e:
                        print(f"[zaplata] Parse error: {e}", file=sys.stderr)
                        continue

                print(f"[zaplata] Page {page}: {len(items)} items parsed", file=sys.stderr)

                if page < 3:
                    time.sleep(random.uniform(3, 5))

            except Exception as e:
                print(f"[zaplata] Fetch error page {page}: {e}", file=sys.stderr)
                break

    except Exception as e:
        print(f"[zaplata] Init error: {e}", file=sys.stderr)

    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_zaplata()
