import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AI Readiness Assessment · 8-Dimension Enterprise Framework',
  description: 'Professional AI readiness assessment with industry benchmarks, weighted scoring across 8 dimensions, and an actionable 12-month maturity roadmap.',
  generator: 'AI Readiness App',
  applicationName: 'AI Readiness',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Readiness',
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
    title: 'AI Readiness Assessment',
    description: 'Assess your organisation across 8 dimensions with industry benchmarks and a phased 12-month roadmap.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
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
        // Prebuilt dark theme handles every element's contrast properly —
        // this is the only way to reliably style Clerk v7 without running
        // into Tailwind-JIT class purging problems.
        baseTheme: dark,
        variables: {
          colorPrimary: '#0066ff',
          colorBackground: '#0a0a0a',
          colorInputBackground: '#1a1a1a',
          colorInputText: '#fafafa',
          colorText: '#fafafa',
          colorTextSecondary: 'rgba(255,255,255,0.7)',
          colorNeutral: '#fafafa',
          colorDanger: '#f43f5e',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          borderRadius: '0.75rem',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
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
