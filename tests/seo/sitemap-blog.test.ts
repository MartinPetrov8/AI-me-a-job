import { describe, it, expect, vi } from 'vitest';
import sitemap from '@/app/sitemap';
import * as blogModule from '@/lib/blog';

vi.mock('@/lib/blog', () => ({
  getBlogPosts: vi.fn(() => [
    {
      title: 'How AI Job Matching Works',
      date: '2026-03-01',
      excerpt: 'Learn how AI can match you to the perfect job',
      slug: 'how-ai-job-matching-works',
      tags: ['ai', 'job-search', 'guide'],
    },
    {
      title: 'Best Job Boards for Data Scientists 2026',
      date: '2026-03-05',
      excerpt: 'Top job boards for data science professionals',
      slug: 'best-job-boards-data-scientists-2026',
      tags: ['data-science', 'job-boards', 'career'],
    },
    {
      title: 'AI vs Traditional Job Search',
      date: '2026-03-10',
      excerpt: 'Comparing AI-powered and traditional job search',
      slug: 'ai-vs-traditional-job-search',
      tags: ['ai', 'productivity', 'job-search'],
    },
    {
      title: 'Top Tech Jobs in Bulgaria 2026',
      date: '2026-03-15',
      excerpt: 'Tech job market in Bulgaria',
      slug: 'top-tech-jobs-bulgaria-2026',
      tags: ['bulgaria', 'tech-jobs', 'career'],
    },
    {
      title: 'How to Optimize Your CV for ATS',
      date: '2026-03-18',
      excerpt: 'ATS optimization tips',
      slug: 'optimize-cv-ats-2026',
      tags: ['cv', 'ats', 'career-tips'],
    },
  ]),
  getRelatedArticles: vi.fn(),
}));

describe('Sitemap - Blog Integration', () => {
  it('includes /blog entry with priority 0.8', () => {
    const result = sitemap();
    
    const blogIndex = result.find(entry => entry.url === 'https://aimeajob.com/blog');
    expect(blogIndex).toBeTruthy();
    expect(blogIndex?.priority).toBe(0.8);
    expect(blogIndex?.changeFrequency).toBe('weekly');
  });

  it('includes all 5 blog article URLs with priority 0.7', () => {
    const result = sitemap();
    
    const blogArticles = result.filter(entry => 
      entry.url.startsWith('https://aimeajob.com/blog/') && 
      entry.url !== 'https://aimeajob.com/blog'
    );
    
    expect(blogArticles).toHaveLength(5);
    
    blogArticles.forEach(article => {
      expect(article.priority).toBe(0.7);
      expect(article.changeFrequency).toBe('weekly');
    });
  });

  it('includes correct article URLs', () => {
    const result = sitemap();
    
    const expectedUrls = [
      'https://aimeajob.com/blog/how-ai-job-matching-works',
      'https://aimeajob.com/blog/best-job-boards-data-scientists-2026',
      'https://aimeajob.com/blog/ai-vs-traditional-job-search',
      'https://aimeajob.com/blog/top-tech-jobs-bulgaria-2026',
      'https://aimeajob.com/blog/optimize-cv-ats-2026',
    ];
    
    expectedUrls.forEach(url => {
      const entry = result.find(e => e.url === url);
      expect(entry).toBeTruthy();
    });
  });

  it('uses article date as lastModified', () => {
    const result = sitemap();
    
    const firstArticle = result.find(
      entry => entry.url === 'https://aimeajob.com/blog/how-ai-job-matching-works'
    );
    
    expect(firstArticle).toBeTruthy();
    expect(firstArticle?.lastModified).toBeInstanceOf(Date);
    
    const date = firstArticle?.lastModified as Date;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(1);
  });
});
