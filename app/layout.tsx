import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
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
        variables: {
          colorPrimary: '#0066ff',
          colorBackground: '#0a0a0a',
          colorInputBackground: 'rgba(255,255,255,0.05)',
          colorInputText: '#fafafa',
          colorText: '#fafafa',
          colorTextSecondary: 'rgba(255,255,255,0.65)',
          colorNeutral: '#fafafa',
          colorDanger: '#f43f5e',
          colorSuccess: '#10b981',
          borderRadius: '0.75rem',
          fontFamily: 'inherit',
        },
        elements: {
          // Main sign-in / sign-up card
          card: 'bg-[#0a0a0a] border border-white/10 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-white/70',

          // Form fields & labels
          formFieldLabel: 'text-white/80',
          formFieldInput:
            'bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:border-white/40',
          formFieldAction: 'text-white/70 hover:text-white',
          formFieldHintText: 'text-white/50',
          formFieldErrorText: 'text-rose-400',

          // Primary button (Continue / Sign in)
          formButtonPrimary:
            'bg-white text-black hover:bg-white/90 hover:scale-[1.01] transition rounded-full font-semibold shadow-[0_0_16px_rgba(255,255,255,0.2)]',

          // Social buttons (Google, etc.)
          socialButtonsBlockButton:
            'bg-white/5 border border-white/15 text-white hover:bg-white/10 transition',
          socialButtonsBlockButtonText: 'text-white font-medium',
          socialButtonsProviderIcon: 'brightness-0 invert-0',

          // Divider (or)
          dividerLine: 'bg-white/15',
          dividerText: 'text-white/50',

          // Footer (Don't have an account? Sign up)
          footerAction: 'text-white/60',
          footerActionText: 'text-white/60',
          footerActionLink: 'text-white hover:text-white/80 font-semibold',
          footer: 'bg-transparent',

          // Badges (Development mode etc.)
          badge: 'bg-white/10 text-white/80 border border-white/10',

          // Identity preview (shows email during 2-step flow)
          identityPreview: 'bg-white/5 border border-white/15',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-white/70 hover:text-white',

          // OTP / verification code
          otpCodeFieldInput: 'bg-white/5 border border-white/15 text-white',

          // Alerts
          alert: 'bg-white/5 border border-white/15 text-white',
          alertText: 'text-white',

          // User button (avatar in hero)
          userButtonAvatarBox: 'w-8 h-8 ring-2 ring-white/20 hover:ring-white/40 transition',
          userButtonPopoverCard:
            'bg-[#0a0a0a] border border-white/15 shadow-2xl',
          userButtonPopoverMain: 'bg-[#0a0a0a]',
          userButtonPopoverFooter: 'bg-[#0a0a0a] border-t border-white/10',
          userButtonPopoverActionButton:
            'text-white hover:bg-white/5 transition',
          userButtonPopoverActionButtonText: 'text-white',
          userButtonPopoverActionButtonIcon: 'text-white/70',
          userPreview: 'bg-transparent',
          userPreviewMainIdentifier: 'text-white',
          userPreviewSecondaryIdentifier: 'text-white/60',
          userPreviewAvatarContainer: 'bg-white/10',

          // Generic text inside popovers
          text__primary: 'text-white',
          text__secondary: 'text-white/70',

          // Profile / Account management pages
          profileSectionTitleText: 'text-white',
          profileSectionContent: 'text-white/80',
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
