import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'Digital Readiness AI · 8-Dimension Enterprise Framework',
  description: 'Professional AI readiness assessment with industry benchmarks, weighted scoring across 8 dimensions, and an actionable 12-month maturity roadmap.',
  generator: 'Digital Readiness AI',
  applicationName: 'Digital Readiness AI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Digital Readiness AI',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Digital Readiness AI',
    description: 'Assess your organisation across 8 dimensions with industry benchmarks and a phased 12-month roadmap.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1b1938' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1938' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#714cb6',
          borderRadius: '0.5rem',
          fontFamily: "'Inter', system-ui, sans-serif",
        },
      }}
    >
      <html lang="en">
        <body className="font-sans antialiased">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
