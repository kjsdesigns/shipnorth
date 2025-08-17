import type { Metadata } from 'next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './globals-simple.css'

export const metadata: Metadata = {
  title: 'Shipnorth - Modern Logistics Platform',
  description: 'Autonomous shipping and billing system with real-time tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}