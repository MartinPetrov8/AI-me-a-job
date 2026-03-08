import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-me-a-job',
  description: 'AI job matching web app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
