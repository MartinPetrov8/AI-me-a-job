import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | aimeajob',
  description: 'Create your free aimeajob account. No credit card required.',
  openGraph: {
    title: 'Sign Up | aimeajob',
    description: 'Create your free aimeajob account. No credit card required.',
    url: 'https://aimeajob.com/signup',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up | aimeajob',
    description: 'Create your free aimeajob account. No credit card required.',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
