import { describe, it, expect } from 'vitest';
import { getBlogPosts } from './blog';

describe('getBlogPosts', () => {
  it('should return array including best-job-boards-data-scientists-2026 article', () => {
    const posts = getBlogPosts();
    const article = posts.find(p => p.slug === 'best-job-boards-data-scientists-2026');
    
    expect(article).toBeDefined();
    expect(article?.title).toBe('Best Job Boards for Data Scientists in 2026');
    expect(article?.date).toBe('2026-03-05');
    expect(article?.tags).toContain('data-science');
    expect(article?.tags).toContain('job-boards');
    expect(article?.tags).toContain('career');
  });

  it('should return array including ai-vs-traditional-job-search article', () => {
    const posts = getBlogPosts();
    const article = posts.find(p => p.slug === 'ai-vs-traditional-job-search');
    
    expect(article).toBeDefined();
    expect(article?.title).toBe('AI vs Traditional Job Search: The 2026 Reality Check');
    expect(article?.date).toBe('2026-03-10');
    expect(article?.tags).toContain('ai');
    expect(article?.tags).toContain('productivity');
    expect(article?.tags).toContain('job-search');
  });

  it('should return posts sorted by date descending', () => {
    const posts = getBlogPosts();
    
    expect(posts.length).toBeGreaterThan(0);
    
    for (let i = 0; i < posts.length - 1; i++) {
      const currentDate = new Date(posts[i].date);
      const nextDate = new Date(posts[i + 1].date);
      expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
    }
  });

  it('should fail if best-job-boards-data-scientists-2026.mdx is missing', () => {
    const posts = getBlogPosts();
    const exists = posts.some(p => p.slug === 'best-job-boards-data-scientists-2026');
    expect(exists).toBe(true);
  });

  it('should fail if ai-vs-traditional-job-search.mdx is missing', () => {
    const posts = getBlogPosts();
    const exists = posts.some(p => p.slug === 'ai-vs-traditional-job-search');
    expect(exists).toBe(true);
  });
});
