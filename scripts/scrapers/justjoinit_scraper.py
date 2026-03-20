#!/usr/bin/env python3
import json
import sys
import requests

def scrape_justjoinit():
    jobs = []
    
    try:
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)'
        }
        
        response = requests.get('https://justjoin.it/api/offers', headers=headers, timeout=30)
        
        if response.status_code != 200:
            print(json.dumps([]))
            return
        
        data = response.json()
        
        if not isinstance(data, list):
            print(json.dumps([]))
            return
        
        for item in data[:100]:
            try:
                job_id = item.get('id', '')
                if not job_id:
                    continue
                
                title = item.get('title', 'Untitled')
                company_name = item.get('company_name', '')
                
                city = item.get('city', '')
                country_code = item.get('country_code', 'PL')
                location = f"{city}, {country_code}" if city else country_code
                
                remote = item.get('remote', False) or item.get('remote_interview', False)
                
                employment_types = item.get('employment_types', [])
                employment_type = employment_types[0].get('type') if employment_types else None
                
                skills = item.get('skills', [])
                skill_names = [s.get('name', '') for s in skills if s.get('name')]
                skills_text = ', '.join(skill_names[:10])
                
                salary_from = None
                salary_to = None
                salary_currency = None
                employment_info = employment_types[0] if employment_types else {}
                if employment_info:
                    salary_from = employment_info.get('from_pln') or employment_info.get('salary_from')
                    salary_to = employment_info.get('to_pln') or employment_info.get('salary_to')
                    salary_currency = employment_info.get('currency', 'PLN')
                
                salary_text = ''
                if salary_from and salary_to:
                    salary_text = f"Salary: {salary_from} - {salary_to} {salary_currency}\n"
                elif salary_from:
                    salary_text = f"Salary: from {salary_from} {salary_currency}\n"
                
                description = f"{salary_text}Skills: {skills_text}" if skills_text else salary_text
                
                job_url = f"https://justjoin.it/offers/{job_id}"
                
                jobs.append({
                    'source': 'justjoinit',
                    'external_id': f'justjoinit-{job_id}',
                    'title': title,
                    'company': company_name or None,
                    'location': location,
                    'url': job_url,
                    'description': description,
                    'posted_at': None,
                    'country': 'PL',
                    'remote': remote
                })
            except Exception:
                continue
    
    except Exception:
        pass
    
    print(json.dumps(jobs))

if __name__ == '__main__':
    scrape_justjoinit()
