import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About aimeajob — AI-Powered Job Matching for Europe',
  description: 'Built in Sofia, Bulgaria. aimeajob uses AI to match your skills with opportunities across Bulgaria, Romania, Poland and remote European roles.',
  openGraph: {
    title: 'About aimeajob — AI-Powered Job Matching for Europe',
    description: 'Built in Sofia, Bulgaria. aimeajob uses AI to match your skills with opportunities across Bulgaria, Romania, Poland and remote European roles.',
    url: 'https://aimeajob.com/about',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About aimeajob — AI-Powered Job Matching for Europe',
    description: 'Built in Sofia, Bulgaria. aimeajob uses AI to match your skills with opportunities across Bulgaria, Romania, Poland and remote European roles.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
