import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Your CV | aimeajob',
  description: 'Upload your CV in PDF or DOCX format. Our AI analyzes it in seconds and extracts 8 matching criteria.',
  openGraph: {
    title: 'Upload Your CV | aimeajob',
    description: 'Upload your CV in PDF or DOCX format. Our AI analyzes it in seconds and extracts 8 matching criteria.',
    url: 'https://aimeajob.com/upload',
    siteName: 'aimeajob',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Upload Your CV | aimeajob',
    description: 'Upload your CV in PDF or DOCX format. Our AI analyzes it in seconds and extracts 8 matching criteria.',
  },
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
