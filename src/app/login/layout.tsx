import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | aimeajob',
  description: 'Sign in to your aimeajob account to view your job matches.',
  openGraph: {
    title: 'Log In | aimeajob',
    description: 'Sign in to your aimeajob account to view your job matches.',
    url: 'https://aimeajob.com/login',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log In | aimeajob',
    description: 'Sign in to your aimeajob account to view your job matches.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
