'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = 
    pathname === '/login' || 
    pathname?.startsWith('/login') || 
    pathname === '/signup' || 
    pathname?.startsWith('/signup');

  if (isAuthPage) {
    return (
      <main className="w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 bg-[#ffffff] text-[#5347CE]">
          {children}
        </main>
      </div>
    </div>
  );
}
