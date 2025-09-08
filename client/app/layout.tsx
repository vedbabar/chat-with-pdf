import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ClerkProvider, SignedIn, SignedOut, SignUp } from '@clerk/nextjs';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
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
        <body className={`${geistSans.variable} antialiased`}>
          {/* For signed-out users, show a full-page, centered sign-up form. */}
          <SignedOut>
            <main className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
              <SignUp />
            </main>
          </SignedOut>

          {/* For signed-in users, render the main application dashboard. */}
          <SignedIn>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}

