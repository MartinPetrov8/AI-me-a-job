#!/usr/bin/env python3
"""Bulldogjob.com scraper — Poland's #3 IT job board.
Uses Fetcher first (simpler site), falls back to DynamicFetcher if needed.
Outputs JSON array of job objects to stdout.
"""
import json
import random
import re
import sys
import time
from datetime import datetime

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
            
            url = f"https://bulldogjob.com/companies/jobs?page={page}" if page > 1 else "https://bulldogjob.com/companies/jobs"
            
            try:
                if use_dynamic:
                    if not dynamic_fetcher:
                        dynamic_fetcher = DynamicFetcher()
                    response = dynamic_fetcher.fetch(url, headless=True, timeout=15000)
                else:
                    response = fetcher.get(url)
                
                if not response or response.status != 200:
                    if response and response.status == 403 and not use_dynamic:
                        print(f"[bulldogjob] Blocked on page {page}, switching to DynamicFetcher", file=sys.stderr)
                        use_dynamic = True
                        if not dynamic_fetcher:
                            dynamic_fetcher = DynamicFetcher()
                        response = dynamic_fetcher.fetch(url, headless=True, timeout=15000)
                        if not response or response.status != 200:
                            print(f"[bulldogjob] DynamicFetcher also failed: {getattr(response, 'status', 'unknown')}", file=sys.stderr)
                            break
                    else:
                        print(f"[bulldogjob] HTTP {getattr(response, 'status', 'unknown')} for page {page}", file=sys.stderr)
                        break
                
                content = response.html_content
                if not content:
                    print(f"[bulldogjob] Empty content for page {page}", file=sys.stderr)
                    break
                
                if 'captcha-delivery' in content or 'cf-browser-verification' in content:
                    print(f"[bulldogjob] CAPTCHA detected on page {page}", file=sys.stderr)
                    break
                
                job_cards = re.findall(r'<div[^>]*class="[^"]*job-item[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', content, re.DOTALL)
                
                if not job_cards:
                    job_cards = re.findall(r'<article[^>]*class="[^"]*job[^"]*"[^>]*>(.*?)</article>', content, re.DOTALL)
                
                if not job_cards:
                    job_cards = re.findall(r'<a[^>]*href="/companies/jobs/[^"]*"[^>]*>(.*?)</a>', content, re.DOTALL)
                
                if not job_cards:
                    print(f"[bulldogjob] No job cards found on page {page}", file=sys.stderr)
                    break
                
                for card in job_cards[:100]:
                    try:
                        title_match = re.search(r'<h[23][^>]*>(.*?)</h[23]>', card, re.DOTALL)
                        if not title_match:
                            title_match = re.search(r'<div[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)</div>', card, re.DOTALL)
                        
                        url_match = re.search(r'href="(/companies/jobs/[^"]*)"', card)
                        if not url_match:
                            url_match = re.search(r'href="(https://bulldogjob\.com/companies/jobs/[^"]*)"', card)
                        
                        if not title_match or not url_match:
                            continue
                        
                        job_url = url_match.group(1).strip()
                        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
                        title = re.sub(r'\s+', ' ', title).strip()
                        
                        if not job_url.startswith('http'):
                            job_url = f"https://bulldogjob.com{job_url}"
                        
                        if job_url in seen_urls or not title:
                            continue
                        
                        seen_urls.add(job_url)
                        
                        company = None
                        company_match = re.search(r'<span[^>]*class="[^"]*company[^"]*"[^>]*>(.*?)</span>', card, re.DOTALL)
                        if not company_match:
                            company_match = re.search(r'<div[^>]*class="[^"]*company[^"]*"[^>]*>(.*?)</div>', card, re.DOTALL)
                        if company_match:
                            company = re.sub(r'<[^>]+>', '', company_match.group(1)).strip()
                        
                        location = None
                        location_match = re.search(r'<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)</span>', card, re.DOTALL)
                        if not location_match:
                            location_match = re.search(r'<div[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)</div>', card, re.DOTALL)
                        if location_match:
                            location = re.sub(r'<[^>]+>', '', location_match.group(1)).strip()
                        
                        salary_min = None
                        salary_max = None
                        salary_currency = None
                        salary_match = re.search(r'(\d[\d\s,.]*)\s*-\s*(\d[\d\s,.]*)\s*(PLN|EUR|USD)', card, re.IGNORECASE)
                        if salary_match:
                            try:
                                salary_min = int(re.sub(r'[^\d]', '', salary_match.group(1)))
                                salary_max = int(re.sub(r'[^\d]', '', salary_match.group(2)))
                                salary_currency = salary_match.group(3).upper()
                            except ValueError:
                                pass
                        
                        posted_at = None
                        date_match = re.search(r'(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)', card, re.IGNORECASE)
                        if date_match:
                            try:
                                day = int(date_match.group(1))
                                month_name = date_match.group(2)
                                year = datetime.now().year
                                posted_at = datetime.strptime(f"{day} {month_name} {year}", "%d %B %Y").isoformat() + 'Z'
                            except ValueError:
                                pass
                        
                        full_text = f"{title} {company or ''} {location or ''}".lower()
                        remote = 'remote' in full_text or 'work from home' in full_text
                        
                        job_id = job_url.split('/')[-1].split('?')[0]
                        if not job_id:
                            job_id = str(abs(hash(job_url)))
                        
                        jobs.append({
                            'source': 'bulldogjob',
                            'external_id': f'bulldogjob-{job_id}',
                            'title': title,
                            'company': company,
                            'location': location or 'Poland',
                            'url': job_url,
                            'description': '',
                            'posted_at': posted_at,
                            'country': 'PL',
                            'remote': remote,
                            'salary_min': salary_min,
                            'salary_max': salary_max,
                            'salary_currency': salary_currency,
                            'employment_type': None
                        })
                    
                    except Exception as e:
                        print(f"[bulldogjob] Parse error: {e}", file=sys.stderr)
                        continue
                
                print(f"[bulldogjob] page {page}: {len(job_cards)} cards found", file=sys.stderr)
                
                if page < 2:
                    time.sleep(random.uniform(3, 5))
            
            except Exception as e:
                print(f"[bulldogjob] Fetch error page {page}: {e}", file=sys.stderr)
                break
    
    except Exception as e:
        print(f"[bulldogjob] Init error: {e}", file=sys.stderr)
    
    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_bulldogjob()
