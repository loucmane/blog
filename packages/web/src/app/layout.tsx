import type { Metadata } from 'next'

import { ThemeProvider } from '@minniewinnie/ui/providers'

import { resolveSiteUrl } from '@/lib/site-url'

import './globals.css'

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  description:
    'An implementation-ready foundation for an independent, owner-operated editorial magazine.',
  metadataBase: resolveSiteUrl(),
  openGraph: {
    description:
      'An implementation-ready foundation for an independent, owner-operated editorial magazine.',
    siteName: 'Magazine Foundation',
    title: 'Magazine Foundation',
    type: 'website',
  },
  title: {
    default: 'Magazine Foundation',
    template: '%s | Magazine Foundation',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
