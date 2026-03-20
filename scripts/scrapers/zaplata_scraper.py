#!/usr/bin/env python3
import json
import random
import time
import sys
from scrapling import StealthyFetcher

def scrape_zaplata():
    jobs = []
    base_url = 'https://www.zaplata.bg/en/it/'
    
    try:
        fetcher = StealthyFetcher()
        
        for page in range(1, 4):
            url = f"{base_url}?page={page}" if page > 1 else base_url
            
            try:
                response = fetcher.get(url)
                
                if not response or not hasattr(response, 'html'):
                    break
                
                html = response.html
                
                job_items = html.css('.job-item, .vacancy-item, .offer-item, article')
                if not job_items:
                    break
                
                for item in job_items:
                    try:
                        title_elem = item.css_first('h2, h3, .job-title, .vacancy-title')
                        if not title_elem:
                            continue
                        title = title_elem.text.strip()
                        
                        company_elem = item.css_first('.company, .company-name, .employer')
                        company = company_elem.text.strip() if company_elem else ''
                        
                        location_elem = item.css_first('.location, .city')
                        location = location_elem.text.strip() if location_elem else ''
                        
                        url_elem = item.css_first('a')
                        job_url = url_elem.attributes.get('href', '') if url_elem else ''
                        if job_url and not job_url.startswith('http'):
                            job_url = 'https://www.zaplata.bg' + job_url
                        
                        salary_elem = item.css_first('.salary, .wage, .payment')
                        salary_text = salary_elem.text.strip() if salary_elem else ''
                        
                        description_elem = item.css_first('.description, .job-description')
                        description = description_elem.text.strip() if description_elem else ''
                        if salary_text:
                            description = f"Salary: {salary_text}\n{description}"
                        
                        job_id = job_url.split('/')[-1] if job_url else str(abs(hash(title + company)))
                        
                        if not job_url or not title:
                            continue
                        
                        full_text = f"{title} {description}".lower()
                        remote = 'remote' in full_text or 'дистанционно' in full_text
                        
                        jobs.append({
                            'source': 'zaplata',
                            'external_id': f'zaplata-{job_id}',
                            'title': title,
                            'company': company or None,
                            'location': location or None,
                            'url': job_url,
                            'description': description,
                            'posted_at': None,
                            'country': 'BG',
                            'remote': remote
                        })
                    except Exception:
                        continue
                
                if page < 3:
                    time.sleep(random.uniform(3, 5))
            
            except Exception:
                break
        
        fetcher.close()
    except Exception:
        pass
    
    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_zaplata()
