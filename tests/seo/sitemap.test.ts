import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';

describe('sitemap', () => {
  it('returns array of sitemap entries', () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes homepage with priority 1.0', () => {
    const result = sitemap();
    const homepage = result.find((entry) => entry.url === 'https://aimeajob.com');
    expect(homepage).toBeDefined();
    expect(homepage?.priority).toBe(1.0);
    expect(homepage?.changeFrequency).toBe('weekly');
  });

  it('includes upload page with priority 0.9', () => {
    const result = sitemap();
    const uploadPage = result.find((entry) => entry.url === 'https://aimeajob.com/upload');
    expect(uploadPage).toBeDefined();
    expect(uploadPage?.priority).toBe(0.9);
    expect(uploadPage?.changeFrequency).toBe('monthly');
  });

  it('includes pricing page with priority 0.8', () => {
    const result = sitemap();
    const pricingPage = result.find((entry) => entry.url === 'https://aimeajob.com/pricing');
    expect(pricingPage).toBeDefined();
    expect(pricingPage?.priority).toBe(0.8);
    expect(pricingPage?.changeFrequency).toBe('monthly');
  });

  it('includes about page with priority 0.7', () => {
    const result = sitemap();
    const aboutPage = result.find((entry) => entry.url === 'https://aimeajob.com/about');
    expect(aboutPage).toBeDefined();
    expect(aboutPage?.priority).toBe(0.7);
    expect(aboutPage?.changeFrequency).toBe('monthly');
  });

  it('includes all required pages', () => {
    const result = sitemap();
    const urls = result.map((entry) => entry.url);
    expect(urls).toContain('https://aimeajob.com');
    expect(urls).toContain('https://aimeajob.com/upload');
    expect(urls).toContain('https://aimeajob.com/pricing');
    expect(urls).toContain('https://aimeajob.com/about');
    expect(urls).toContain('https://aimeajob.com/login');
    expect(urls).toContain('https://aimeajob.com/signup');
    expect(urls).toContain('https://aimeajob.com/privacy');
    expect(urls).toContain('https://aimeajob.com/terms');
  });
});
