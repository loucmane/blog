import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}