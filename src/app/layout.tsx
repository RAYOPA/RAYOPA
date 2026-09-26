import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowPilot AI',
  description: 'Intelligent Business Workflow Automation platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FBFADA] text-[#12372A] flex h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 bg-[#FBFADA] text-[#12372A]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
