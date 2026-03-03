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
    url: 'https://ourtab.online',
    siteName: 'OurTab',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OurTab - Shared Grocery Tracker & Expense Manager',
    description: 'Split grocery bills and track shared expenses with ease.',
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
