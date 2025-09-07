import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  SignUp // Import the full SignUp component for a better experience
} from '@clerk/nextjs';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DocuChat AI',
  description: 'Chat with your PDF documents',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-900`}
        >
          

          {/* The main application content (your page.tsx) will only be shown to signed-in users */}
          <SignedIn>
            {children}
          </SignedIn>

          {/* For signed-out users, show a centered sign-up form */}
          <SignedOut>
            <main className="flex items-center justify-center h-[calc(100vh-80px)]">
              <SignUp />
            </main>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
