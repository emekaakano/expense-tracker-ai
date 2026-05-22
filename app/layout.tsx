import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { DemoBanner } from '@/components/layout/DemoBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExpenseAI — Smart Expense Tracker',
  description: 'Track your personal finances with ease',
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
