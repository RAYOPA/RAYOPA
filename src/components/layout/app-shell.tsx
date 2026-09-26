"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/login" ||
    pathname?.startsWith("/login") ||
    pathname === "/signup" ||
    pathname?.startsWith("/signup");

  if (isAuthPage) {
    return (
      <main className="w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden w-full" style={{ background: "var(--fp-bg)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto fp-page-enter"
          style={{ background: "var(--fp-bg)" }}
        >
          <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
