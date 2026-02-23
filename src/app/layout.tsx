import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Optim Dental AI Stoma',
  description: 'AI-powered dental X-ray analysis for treatment planning and diagnostics',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ro">
      <body className="antialiased">{children}</body>
    </html>
  )
}
