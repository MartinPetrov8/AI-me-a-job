import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

describe('/blog/[slug] page', () => {
  let postData: { title: string; date: string; tags: string[] } | null = null;

  beforeAll(() => {
    const blogDir = path.join(process.cwd(), 'content/blog');
    const filePath = path.join(blogDir, 'how-ai-job-matching-works.mdx');
    
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      postData = {
        title: data.title || '',
        date: data.date || '',
        tags: data.tags || [],
      };
    }
  });

  it('MDX file exists for how-ai-job-matching-works', () => {
    const blogDir = path.join(process.cwd(), 'content/blog');
    const filePath = path.join(blogDir, 'how-ai-job-matching-works.mdx');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('frontmatter contains title "How AI Job Matching Works"', () => {
    expect(postData).not.toBeNull();
    expect(postData?.title).toBe('How AI Job Matching Works');
  });

  it('frontmatter date is 2026-03-01', () => {
    expect(postData).not.toBeNull();
    expect(postData?.date).toBe('2026-03-01');
  });

  it('frontmatter tags include "ai"', () => {
    expect(postData).not.toBeNull();
    expect(postData?.tags).toContain('ai');
  });

  it('frontmatter tags include "job-search"', () => {
    expect(postData).not.toBeNull();
    expect(postData?.tags).toContain('job-search');
  });

  it('frontmatter tags include "guide"', () => {
    expect(postData).not.toBeNull();
    expect(postData?.tags).toContain('guide');
  });
});
