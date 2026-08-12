import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MyTaskFlow - Rastreador de Hábitos',
  description: 'Acompanhe seus hábitos diários, visualize seu progresso e conquiste recompensas',
  generator: 'MyTaskFlow',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'MyTaskFlow',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/mytaskflow-icon.svg', type: 'image/svg+xml' },
      { url: '/mytaskflow-icon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/mytaskflow-icon.svg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#7C3AED' },
    { media: '(prefers-color-scheme: dark)', color: '#7C3AED' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="font-sans antialiased overflow-x-hidden h-full">
        <div className="min-h-full flex flex-col">
          {children}
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
