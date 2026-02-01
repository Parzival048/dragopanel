import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dragohost - Premium Minecraft Hosting',
  description: 'Experience lightning-fast, premium Minecraft server hosting with 24/7 uptime, instant setup, and enterprise-grade DDoS protection.',
  keywords: ['Minecraft hosting', 'game server', 'Minecraft server', 'premium hosting', 'Dragohost'],
  authors: [{ name: 'Dragohost' }],
  openGraph: {
    title: 'Dragohost - Premium Minecraft Hosting',
    description: 'Experience lightning-fast, premium Minecraft server hosting with 24/7 uptime, instant setup, and enterprise-grade DDoS protection.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dragohost - Premium Minecraft Hosting',
    description: 'Experience lightning-fast, premium Minecraft server hosting with 24/7 uptime, instant setup, and enterprise-grade DDoS protection.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="beforeInteractive" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
