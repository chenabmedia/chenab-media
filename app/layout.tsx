import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono, Syne, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioProvider } from '@/context/AudioContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AudioPlayerDrawer } from '@/components/AudioPlayerDrawer';
import { NavigationProgressBar } from '@/components/NavigationProgressBar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080808',
  viewportFit: 'cover',
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://chenabmedia.in'),
  title: {
    default: 'CHENAB MEDIA — Independent Label from Jammu & Kashmir',
    template: '%s | CHENAB MEDIA',
  },
  applicationName: 'CHENAB MEDIA',
  description: 'CHENAB Media is an independent label by the artist, for the artist, based in Jammu & Kashmir, India.',
  openGraph: {
    title: 'CHENAB MEDIA — Independent Label from Jammu & Kashmir',
    description: 'CHENAB Media is an independent label by the artist, for the artist, based in Jammu & Kashmir, India.',
    url: 'https://chenabmedia.in/',
    type: 'website',
    siteName: 'CHENAB MEDIA',
    locale: 'en_US',
    images: [
      {
        url: 'https://chenabmedia.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CHENAB MEDIA — Independent Label from Jammu & Kashmir',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CHENAB MEDIA — Independent Label from Jammu & Kashmir',
    description: 'CHENAB Media is an independent label by the artist, for the artist, based in Jammu & Kashmir, India.',
    images: ['https://chenabmedia.in/og-image.png'],
  },
  alternates: {
    canonical: 'https://chenabmedia.in/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} ${syne.variable} ${instrumentSerif.variable}`}
    >
      <body className="bg-[#080808] text-[#F5F5F5] antialiased selection:bg-[#F5F5F5] selection:text-[#080808]">
        <AuthProvider>
          <AudioProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <NavigationProgressBar />
              </Suspense>
              <div className="min-h-screen flex flex-col bg-[#080808] text-[#F5F5F5]">
                <Navbar />
                <main className="flex-1 pt-20">{children}</main>
                <Footer />
                <AudioPlayerDrawer />
              </div>
            </ToastProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

