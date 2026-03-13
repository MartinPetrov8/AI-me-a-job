import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-me-a-job · AI Job Matching',
  description: 'Upload your CV and get AI-matched jobs ranked by fit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#F7F7F5] text-gray-900 antialiased">{children}</body>
    </html>
  )
}
