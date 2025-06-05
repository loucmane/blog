import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata: Metadata = {
  title: 'Animal Protection Foundation',
  description: 'Dedicated to protecting and rescuing animals in need',
  keywords: ['animal protection', 'animal rescue', 'donation', 'emergency appeals'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}