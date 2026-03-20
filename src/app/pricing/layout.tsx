import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Free & Pro Plans | aimeajob',
  description: 'Start free with 5 job matches. Upgrade to Pro for €5/month to unlock all matches and weekly job digests.',
  openGraph: {
    title: 'Pricing — Free & Pro Plans | aimeajob',
    description: 'Start free with 5 job matches. Upgrade to Pro for €5/month to unlock all matches and weekly job digests.',
    url: 'https://aimeajob.com/pricing',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Free & Pro Plans | aimeajob',
    description: 'Start free with 5 job matches. Upgrade to Pro for €5/month to unlock all matches and weekly job digests.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
