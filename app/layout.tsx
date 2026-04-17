import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/providers'
import { AuthProvider } from '@/lib/auth-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Humor Flavor Prompt Chain',
  description: 'Manage humor flavors and generate captions',
}

// Don't prerender - this app uses client-side auth and context
export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
