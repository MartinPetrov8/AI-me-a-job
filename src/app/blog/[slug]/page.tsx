import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPosts, getRelatedArticles } from '@/lib/blog';

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

async function getPost(slug: string) {
  const blogDir = path.join(process.cwd(), 'content/blog');
  const files = fs.readdirSync(blogDir).filter(file => file.endsWith('.mdx'));
  
  const file = files.find(f => {
    const filePath = path.join(blogDir, f);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    return data.slug === slug || f.replace('.mdx', '') === slug;
  });

  if (!file) {
    return null;
  }

  const filePath = path.join(blogDir, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);

  return {
    title: data.title || '',
    date: data.date || '',
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    content,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(slug, 3);

  return (
    <div>
      <article className="prose prose-lg mx-auto">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">{post.title}</h1>
        <p className="mb-8 text-gray-500">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="whitespace-pre-wrap text-gray-700">{post.content}</div>
      </article>

      {relatedArticles.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl" data-testid="related-articles">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Related Articles</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="block rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  {article.title}
                </h3>
                <p className="mb-4 text-sm text-gray-600">{article.excerpt}</p>
                <span className="text-sm font-medium text-indigo-600">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
