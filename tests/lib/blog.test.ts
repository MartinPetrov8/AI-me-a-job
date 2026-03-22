import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBlogPosts } from '@/lib/blog';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('path');

describe('getBlogPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when blog directory does not exist', () => {
    vi.spyOn(path, 'join').mockReturnValue('/fake/content/blog');
    vi.spyOn(process, 'cwd').mockReturnValue('/fake');
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const posts = getBlogPosts();

    expect(posts).toEqual([]);
  });

  it('returns empty array when no MDX files exist', () => {
    vi.spyOn(path, 'join').mockReturnValue('/fake/content/blog');
    vi.spyOn(process, 'cwd').mockReturnValue('/fake');
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue([] as any);

    const posts = getBlogPosts();

    expect(posts).toEqual([]);
  });

  it('parses frontmatter and returns blog posts sorted by date descending', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/fake');
    vi.spyOn(path, 'join').mockImplementation((...args: string[]) => {
      return args.join('/');
    });
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['post1.mdx', 'post2.mdx', 'post3.mdx'] as any);

    const mockPosts = {
      'post1.mdx': `---
title: First Post
date: '2026-03-01'
excerpt: This is the first post
slug: first-post
tags: ['ai', 'job-search']
---
Content here`,
      'post2.mdx': `---
title: Second Post
date: '2026-03-15'
excerpt: This is the second post
slug: second-post
tags: ['career', 'tips']
---
More content`,
      'post3.mdx': `---
title: Third Post
date: '2026-03-10'
excerpt: This is the third post
slug: third-post
tags: ['guide']
---
Even more content`,
    };

    vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      const pathStr = filePath.toString();
      if (pathStr.includes('post1.mdx')) return mockPosts['post1.mdx'];
      if (pathStr.includes('post2.mdx')) return mockPosts['post2.mdx'];
      if (pathStr.includes('post3.mdx')) return mockPosts['post3.mdx'];
      return '';
    });

    const posts = getBlogPosts();

    expect(posts).toHaveLength(3);
    expect(posts[0].slug).toBe('second-post');
    expect(posts[0].date).toBe('2026-03-15');
    expect(posts[1].slug).toBe('third-post');
    expect(posts[1].date).toBe('2026-03-10');
    expect(posts[2].slug).toBe('first-post');
    expect(posts[2].date).toBe('2026-03-01');
  });

  it('returns all required fields for each blog post', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/fake');
    vi.spyOn(path, 'join').mockImplementation((...args: string[]) => {
      return args.join('/');
    });
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['test-post.mdx'] as any);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(`---
title: Test Post
date: '2026-03-01'
excerpt: Test excerpt
slug: test-post
tags: ['test', 'vitest']
---
Test content`);

    const posts = getBlogPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0]).toHaveProperty('title', 'Test Post');
    expect(posts[0]).toHaveProperty('date', '2026-03-01');
    expect(posts[0]).toHaveProperty('excerpt', 'Test excerpt');
    expect(posts[0]).toHaveProperty('slug', 'test-post');
    expect(posts[0]).toHaveProperty('tags');
    expect(posts[0].tags).toEqual(['test', 'vitest']);
  });

  it('handles missing frontmatter fields gracefully', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/fake');
    vi.spyOn(path, 'join').mockImplementation((...args: string[]) => {
      return args.join('/');
    });
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readdirSync').mockReturnValue(['incomplete.mdx'] as any);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(`---
title: Incomplete Post
---
Content without all fields`);

    const posts = getBlogPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Incomplete Post');
    expect(posts[0].date).toBe('');
    expect(posts[0].excerpt).toBe('');
    expect(posts[0].slug).toBe('incomplete');
    expect(posts[0].tags).toEqual([]);
  });
});
