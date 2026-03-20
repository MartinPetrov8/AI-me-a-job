#!/usr/bin/env python3
import json
import random
import time
import sys
from scrapling import StealthyFetcher

def scrape_jobs_bg():
    jobs = []
    base_url = 'https://www.jobs.bg/front_job_search.php?categories[]=56'
    
    try:
        fetcher = StealthyFetcher()
        
        for page in range(1, 4):
            url = f"{base_url}&fwp_paged={page}" if page > 1 else base_url
            
            try:
                response = fetcher.fetch(url)
                
                if not response or not hasattr(response, 'html'):
                    break
                
                html = response.html
                
                job_items = html.css('.job-list-item')
                if not job_items:
                    break
                
                for item in job_items:
                    try:
                        job_id_elem = item.attributes.get('data-job-id', '')
                        if not job_id_elem:
                            continue
                        
                        job_id = job_id_elem
                        
                        title_elem = item.css_first('.job-title')
                        title = title_elem.text.strip() if title_elem else 'Untitled'
                        
                        company_elem = item.css_first('.company-name')
                        company = company_elem.text.strip() if company_elem else ''
                        
                        location_elem = item.css_first('.location')
                        location = location_elem.text.strip() if location_elem else ''
                        
                        url_elem = item.css_first('a.overlay-link')
                        job_url = url_elem.attributes.get('href', '') if url_elem else ''
                        if job_url and not job_url.startswith('http'):
                            job_url = 'https://www.jobs.bg' + job_url
                        
                        description_elem = item.css_first('.job-description')
                        description = description_elem.text.strip() if description_elem else ''
                        
                        full_text = f"{title} {description}".lower()
                        remote = 'remote' in full_text or 'дистанционно' in full_text
                        
                        if not job_url or not title:
                            continue
                        
                        jobs.append({
                            'source': 'jobs_bg',
                            'external_id': f'jobsbg-{job_id}',
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
                    time.sleep(random.uniform(2, 5))
            
            except Exception:
                break
        
        fetcher.close()
    except Exception:
        pass
    
    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_jobs_bg()
