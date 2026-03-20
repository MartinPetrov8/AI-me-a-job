import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Job Matches | aimeajob',
  description: 'View your AI-matched job results ranked by relevance.',
  openGraph: {
    title: 'Your Job Matches | aimeajob',
    description: 'View your AI-matched job results ranked by relevance.',
    url: 'https://aimeajob.com/results',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Job Matches | aimeajob',
    description: 'View your AI-matched job results ranked by relevance.',
  },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
