import { Metadata } from 'next';
import HomeClient from './home-client';
import { getBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'AI Job Matching — Find Jobs That Match Your Skills | aimeajob',
  description: 'Upload your CV and get AI-matched jobs ranked by 8 criteria. Free for top 5 matches. Focused on Bulgaria, Romania, Poland and remote European roles.',
  openGraph: {
    title: 'AI Job Matching — Find Jobs That Match Your Skills | aimeajob',
    description: 'Upload your CV and get AI-matched jobs ranked by 8 criteria. Free for top 5 matches. Focused on Bulgaria, Romania, Poland and remote European roles.',
    url: 'https://aimeajob.com',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Job Matching — Find Jobs That Match Your Skills | aimeajob',
    description: 'Upload your CV and get AI-matched jobs ranked by 8 criteria. Free for top 5 matches. Focused on Bulgaria, Romania, Poland and remote European roles.',
  },
};

export default function Home() {
  const blogPosts = getBlogPosts().slice(0, 3);
  return <HomeClient blogPosts={blogPosts} />;
}


