import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-me-a-job · AI Job Matching',
  description: 'Upload your CV and get AI-matched jobs ranked by fit',
}

// Enable safe-area-inset CSS env vars on iPhone notch/Dynamic Island (Issue #41)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
