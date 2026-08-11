import React from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono, Syne, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AudioProvider } from '@/context/AudioContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AudioPlayerDrawer } from '@/components/AudioPlayerDrawer';

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
  title: 'CHENAB MEDIA — Independent Record Label & Artist Collective',
  description: 'An independent record label, artist collective, and creative platform dedicated to sonic experimentation, high-altitude drone acoustics, and uncompromised creative autonomy.',
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
            <div className="min-h-screen flex flex-col bg-[#080808] text-[#F5F5F5]">
              <Navbar />
              <main className="flex-1 pt-20">{children}</main>
              <Footer />
              <AudioPlayerDrawer />
            </div>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

