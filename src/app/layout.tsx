import type { Metadata, Viewport } from 'next';
import { Outfit, Abril_Fatface } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';
import { AuthProvider } from '@/components/AuthContext';
import { ToastProvider } from '@/components/ToastContext';

const outfit = Outfit({ subsets: ['latin'] });
const abril = Abril_Fatface({ weight: '400', subsets: ['latin'], variable: '--font-abril' });

export const metadata: Metadata = {
  title: 'OurTab - Shared Grocery Tracker & Expense Manager',
  description: 'Split grocery bills and track shared expenses with ease. The perfect companion for flatmates and families to manage common costs.',
  keywords: ['grocery tracker', 'expense manager', 'bill splitter', 'shared expenses', 'meal tracker', 'flatmate expenses'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'OurTab - Shared Grocery Tracker & Expense Manager',
    description: 'Split grocery bills and track shared expenses with ease.',
    url: 'https://app.ourtab.online',
    siteName: 'OurTab',
    images: [
      {
        url: '/images/icon.png',
        width: 1200,
        height: 630,
        alt: 'OurTab Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurTab - Shared Grocery Tracker & Expense Manager',
    description: 'Split grocery bills and track shared expenses with ease.',
    images: ['/images/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} ${abril.variable}`}>
        <ThemeRegistry>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
