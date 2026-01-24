// Root Layout with Global Metadata
// SEO: Canonical domain = https://scottbertrand.com
// NO AMP support - intentionally omitted

import type { Metadata } from 'next'
import './globals.css'

// Global metadata base - canonical domain (CRITICAL)
export const metadata: Metadata = {
  metadataBase: new URL('https://scottbertrand.com'),

  // Default title template
  title: {
    default: 'Scott Bertrand — Brand & Web Systems',
    template: '%s | Scott Bertrand',
  },

  description: 'Clear, structured brand and web work for businesses that need clarity, not chaos. Based in Greater Sudbury, serving Northern Ontario & Canada remotely.',

  // Open Graph defaults
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    siteName: 'Scott Bertrand',
    images: [
      {
        url: '/assets/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Scott Bertrand — Brand & Web Systems',
      },
    ],
  },

  // Twitter card defaults
  twitter: {
    card: 'summary_large_image',
  },

  // Robots - production only indexing
  robots: {
    index: process.env.VERCEL_ENV === 'production',
    follow: process.env.VERCEL_ENV === 'production',
    googleBot: {
      index: process.env.VERCEL_ENV === 'production',
      follow: process.env.VERCEL_ENV === 'production',
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons
  icons: {
    icon: '/assets/sb-monogram-light.png',
    apple: '/assets/sb-monogram-light.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />

        {/* Google Fonts - Source Serif 4 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />

        {/* Cloudflare Web Analytics (production only) */}
        {process.env.VERCEL_ENV === 'production' && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon='{"token": "2395db43fd88408c892e4333d6a4bd90"}'
          />
        )}
      </head>
      <body className="font-sans antialiased bg-[#f7f6f3] text-[#111111] dark:bg-[#1c1c1e] dark:text-[#f7f6f3]">
        {children}
      </body>
    </html>
  )
}
