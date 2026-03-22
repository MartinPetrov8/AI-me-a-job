import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeClient from '@/app/home-client';

const mockBlogPosts = [
  {
    title: 'How AI Job Matching Works',
    date: '2026-03-01',
    excerpt: 'Learn how AI can match you to the perfect job',
    slug: 'how-ai-job-matching-works',
  },
  {
    title: 'Best Job Boards for Data Scientists 2026',
    date: '2026-03-05',
    excerpt: 'Top job boards for data science professionals',
    slug: 'best-job-boards-data-scientists-2026',
  },
  {
    title: 'AI vs Traditional Job Search',
    date: '2026-03-10',
    excerpt: 'Comparing AI-powered and traditional job search',
    slug: 'ai-vs-traditional-job-search',
  },
  {
    title: 'Top Tech Jobs in Bulgaria 2026',
    date: '2026-03-15',
    excerpt: 'Tech job market in Bulgaria',
    slug: 'top-tech-jobs-bulgaria-2026',
  },
  {
    title: 'How to Optimize Your CV for ATS',
    date: '2026-03-18',
    excerpt: 'ATS optimization tips',
    slug: 'optimize-cv-ats-2026',
  },
];

describe('HomeClient - Blog Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_jobs: 7000, countries: 7, sources: 12, last_updated: null })
    } as Response);

    (global as any).IntersectionObserver = class IntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      root = null;
      rootMargin = '';
      thresholds = [];
      takeRecords = vi.fn(() => []);
    };
  });

  it('renders From the Blog section', () => {
    render(<HomeClient blogPosts={mockBlogPosts.slice(0, 3)} />);
    
    expect(screen.getByText('From the Blog')).toBeTruthy();
  });

  it('displays exactly 3 blog posts when 5 available', () => {
    const threePosts = mockBlogPosts.slice(0, 3);
    render(<HomeClient blogPosts={threePosts} />);
    
    expect(screen.getByText('How AI Job Matching Works')).toBeTruthy();
    expect(screen.getByText('Best Job Boards for Data Scientists 2026')).toBeTruthy();
    expect(screen.getByText('AI vs Traditional Job Search')).toBeTruthy();
    
    expect(screen.queryByText('Top Tech Jobs in Bulgaria 2026')).toBeNull();
    expect(screen.queryByText('How to Optimize Your CV for ATS')).toBeNull();
  });

  it('displays article title, date, and excerpt for each post', () => {
    const threePosts = mockBlogPosts.slice(0, 3);
    render(<HomeClient blogPosts={threePosts} />);
    
    expect(screen.getByText('How AI Job Matching Works')).toBeTruthy();
    expect(screen.getByText('Learn how AI can match you to the perfect job')).toBeTruthy();
    expect(screen.getByText('March 1, 2026')).toBeTruthy();
  });

  it('uses responsive grid with grid-cols-1 lg:grid-cols-3', () => {
    const threePosts = mockBlogPosts.slice(0, 3);
    const { container } = render(<HomeClient blogPosts={threePosts} />);
    
    const blogSection = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
    expect(blogSection).toBeTruthy();
  });

  it('renders Read more links for each article', () => {
    const threePosts = mockBlogPosts.slice(0, 3);
    render(<HomeClient blogPosts={threePosts} />);
    
    const readMoreLinks = screen.getAllByText('Read more');
    expect(readMoreLinks).toHaveLength(3);
  });

  it('links to correct blog post URLs', () => {
    const threePosts = mockBlogPosts.slice(0, 3);
    const { container } = render(<HomeClient blogPosts={threePosts} />);
    
    const links = container.querySelectorAll('a[href^="/blog/"]');
    expect(links[0].getAttribute('href')).toBe('/blog/how-ai-job-matching-works');
    expect(links[1].getAttribute('href')).toBe('/blog/best-job-boards-data-scientists-2026');
    expect(links[2].getAttribute('href')).toBe('/blog/ai-vs-traditional-job-search');
  });
});
