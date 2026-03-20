import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | aimeajob',
  description: 'Terms and conditions for using the aimeajob job matching platform.',
  openGraph: {
    title: 'Terms of Service | aimeajob',
    description: 'Terms and conditions for using the aimeajob job matching platform.',
    url: 'https://aimeajob.com/terms',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | aimeajob',
    description: 'Terms and conditions for using the aimeajob job matching platform.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
