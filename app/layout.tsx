import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { DemoBanner } from '@/components/layout/DemoBanner';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = 'https://expense-tracker-ai-murex.vercel.app';
const SITE_TITLE = 'Expense Tracker — Personal Finance Dashboard';
const SITE_DESCRIPTION =
  'A modern personal-finance dashboard with month-over-month trends, category breakdowns, and configurable CSV / JSON / PDF exports. Built with Next.js, TypeScript, and Tailwind CSS.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Expense Tracker',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker dashboard showing summary cards, monthly trend chart, and category breakdown',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50`}>
        <ExpenseProvider>
          <Sidebar />
          <main className="min-h-screen pb-20 lg:ml-64 lg:pb-0">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
              <DemoBanner />
              {children}
            </div>
          </main>
          <MobileNav />
        </ExpenseProvider>
      </body>
    </html>
  );
}
