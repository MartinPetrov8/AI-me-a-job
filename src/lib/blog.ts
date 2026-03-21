import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
  tags: string[];
}

export function getBlogPosts(): BlogPost[] {
  const blogDir = path.join(process.cwd(), 'content/blog');
  
  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));

  const posts = files.map(filename => {
    const filePath = path.join(blogDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    return {
      title: data.title || '',
      date: data.date || '',
      excerpt: data.excerpt || '',
      slug: data.slug || filename.replace('.mdx', ''),
      tags: data.tags || [],
    };
  });

  return posts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getRelatedArticles(currentSlug: string, limit = 3): BlogPost[] {
  const allPosts = getBlogPosts();
  const currentPost = allPosts.find(p => p.slug === currentSlug);
  
  if (!currentPost) {
    return allPosts.slice(0, limit);
  }

  const otherPosts = allPosts.filter(p => p.slug !== currentSlug);
  
  const postsWithScore = otherPosts.map(post => {
    const sharedTags = post.tags.filter(tag => currentPost.tags.includes(tag));
    return {
      post,
      score: sharedTags.length,
    };
  });

  postsWithScore.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });

  return postsWithScore.slice(0, limit).map(item => item.post);
}
