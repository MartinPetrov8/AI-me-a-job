import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | aimeajob',
  description: 'How aimeajob collects, uses, and protects your personal data. GDPR compliant.',
  openGraph: {
    title: 'Privacy Policy | aimeajob',
    description: 'How aimeajob collects, uses, and protects your personal data. GDPR compliant.',
    url: 'https://aimeajob.com/privacy',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | aimeajob',
    description: 'How aimeajob collects, uses, and protects your personal data. GDPR compliant.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
