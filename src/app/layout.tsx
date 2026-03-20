import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import ThemeRegistry from '@/components/ThemeRegistry';
import { AuthProvider } from '@/components/AuthContext';
import { ToastProvider } from '@/components/ToastContext';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL('https://app.ourtab.online'),
  title: 'OurTab - Shared Grocery Tracker & Expense Manager',
  description: 'Split grocery bills and track shared expenses with ease. The perfect companion for flatmates and families to manage common costs.',
  keywords: ['grocery tracker', 'expense manager', 'bill splitter', 'shared expenses', 'meal tracker', 'flatmate expenses'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OurTab',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'OurTab - Shared Grocery Tracker & Expense Manager',
    description: 'Split grocery bills and track shared expenses with ease.',
    url: 'https://app.ourtab.online',
    siteName: 'OurTab',
    images: [
      {
        url: '/icon.png',
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
    images: ['/icon.png'],
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
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var mode = localStorage.getItem('themeMode') || 'dark';
                document.documentElement.setAttribute('data-theme', mode);
                var bg = mode === 'light' ? '#faf9ff' : '#0f172a';
                var bgImg = mode === 'light' ? 'linear-gradient(135deg, #faf9ff 0%, #f0ebff 100%)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
                var style = document.createElement('style');
                style.id = 'theme-init-style';
                style.textContent = 'body { background-color: ' + bg + ' !important; background-image: ' + bgImg + ' !important; transition: none !important; }';
                document.head.appendChild(style);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${outfit.className} ${outfit.variable}`} suppressHydrationWarning>
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
