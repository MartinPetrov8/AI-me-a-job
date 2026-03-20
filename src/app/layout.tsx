import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { NavBar } from '@/components/nav-bar'
import { Footer } from '@/components/footer'

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
      <body className="bg-[#F7F7F5] text-gray-900 antialiased">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
