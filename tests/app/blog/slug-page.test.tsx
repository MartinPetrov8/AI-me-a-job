import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getRelatedArticles, getBlogPosts } from '@/lib/blog';
import BlogPostPage from '@/app/blog/[slug]/page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('/blog/[slug] page', () => {
  it('renders related articles section for how-ai-job-matching-works', async () => {
    const params = Promise.resolve({ slug: 'how-ai-job-matching-works' });
    const component = await BlogPostPage({ params });
    const { container } = render(component);
    
    const relatedSection = container.querySelector('[data-testid="related-articles"]');
    expect(relatedSection).not.toBeNull();
  });

  it('related articles section contains 2-3 article links', async () => {
    const params = Promise.resolve({ slug: 'how-ai-job-matching-works' });
    const component = await BlogPostPage({ params });
    const { container } = render(component);
    
    const relatedSection = container.querySelector('[data-testid="related-articles"]');
    const articleLinks = relatedSection?.querySelectorAll('a[href^="/blog/"]');
    
    expect(articleLinks).not.toBeUndefined();
    expect(articleLinks!.length).toBeGreaterThanOrEqual(2);
    expect(articleLinks!.length).toBeLessThanOrEqual(3);
  });

  it('related articles prioritize tag overlap', () => {
    const related = getRelatedArticles('how-ai-job-matching-works', 3);
    
    const currentPost = getBlogPosts().find(p => p.slug === 'how-ai-job-matching-works');
    expect(currentPost).toBeDefined();
    
    if (related.length > 0) {
      const firstRelated = related[0];
      const sharedTags = firstRelated.tags.filter(tag => 
        currentPost!.tags.includes(tag)
      );
      
      expect(sharedTags.length).toBeGreaterThan(0);
    }
  });

  it('getRelatedArticles excludes current article', () => {
    const related = getRelatedArticles('how-ai-job-matching-works', 3);
    const slugs = related.map(p => p.slug);
    
    expect(slugs).not.toContain('how-ai-job-matching-works');
  });

  it('getRelatedArticles returns up to 3 articles', () => {
    const related = getRelatedArticles('how-ai-job-matching-works', 3);
    
    expect(related.length).toBeLessThanOrEqual(3);
  });

  it('getRelatedArticles sorts by tag overlap then date', () => {
    const related = getRelatedArticles('how-ai-job-matching-works', 3);
    const currentPost = getBlogPosts().find(p => p.slug === 'how-ai-job-matching-works');
    
    if (related.length > 1) {
      for (let i = 0; i < related.length - 1; i++) {
        const currentShared = related[i].tags.filter(tag => 
          currentPost!.tags.includes(tag)
        ).length;
        const nextShared = related[i + 1].tags.filter(tag => 
          currentPost!.tags.includes(tag)
        ).length;
        
        expect(currentShared).toBeGreaterThanOrEqual(nextShared);
      }
    }
  });

  it('related articles display title, excerpt, and link', async () => {
    const params = Promise.resolve({ slug: 'how-ai-job-matching-works' });
    const component = await BlogPostPage({ params });
    const { container } = render(component);
    
    const relatedSection = container.querySelector('[data-testid="related-articles"]');
    const firstArticle = relatedSection?.querySelector('a[href^="/blog/"]');
    
    if (firstArticle) {
      const title = firstArticle.querySelector('h3');
      const excerpt = firstArticle.querySelector('p');
      const readMore = firstArticle.textContent;
      
      expect(title).not.toBeNull();
      expect(excerpt).not.toBeNull();
      expect(readMore).toContain('Read more');
    }
  });

  it('related articles use design system styles', async () => {
    const params = Promise.resolve({ slug: 'how-ai-job-matching-works' });
    const component = await BlogPostPage({ params });
    const { container } = render(component);
    
    const relatedSection = container.querySelector('[data-testid="related-articles"]');
    const firstArticle = relatedSection?.querySelector('a[href^="/blog/"]');
    
    if (firstArticle) {
      expect(firstArticle.className).toContain('bg-white');
      expect(firstArticle.className).toContain('rounded-2xl');
      expect(firstArticle.className).toContain('shadow-sm');
    }
  });

  it('related articles grid is responsive', async () => {
    const params = Promise.resolve({ slug: 'how-ai-job-matching-works' });
    const component = await BlogPostPage({ params });
    const { container } = render(component);
    
    const relatedSection = container.querySelector('[data-testid="related-articles"]');
    const grid = relatedSection?.querySelector('.grid');
    
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-3');
  });

  it('falls back to recent posts if no tag matches', () => {
    const allPosts = getBlogPosts();
    
    if (allPosts.length > 0) {
      const related = getRelatedArticles('nonexistent-slug', 3);
      
      expect(related.length).toBeGreaterThan(0);
      expect(related.length).toBeLessThanOrEqual(3);
    }
  });
});
