import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import LandingPage from './landing-page';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Chat-with-PDF - AI-Powered Document Assistant',
  description: 'Transform your PDFs into interactive conversations with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} antialiased`}>
          {/* For signed-out users, show the beautiful landing page */}
          <SignedOut>
            <LandingPage />
          </SignedOut>
          
          {/* For signed-in users, render the main application dashboard */}
          <SignedIn>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
