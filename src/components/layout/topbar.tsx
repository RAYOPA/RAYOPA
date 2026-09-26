"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, HelpCircle, User, RefreshCw, Command } from "lucide-react";

/* ─────────────────────────────────────────────────
   PAGE TITLE MAP
───────────────────────────────────────────────── */
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/":           { title: "Dashboard",    subtitle: "Monitor intelligent workflow operations." },
  "/workflows":  { title: "Workflows",    subtitle: "Manage and inspect autonomous execution workflows." },
  "/approvals":  { title: "Approvals",    subtitle: "Review and authorize pending workflow actions." },
  "/audit":      { title: "Audit Trail",  subtitle: "Immutable ledger of all autonomous actions." },
  "/data":       { title: "Business Data",subtitle: "Invoices, customers, payments, and communications." },
  "/templates":  { title: "Documents",    subtitle: "Indexed documents used by AI workflows." },
  "/analyze":    { title: "Integrations", subtitle: "Connected tools and data sources." },
  "/analytics":  { title: "Analytics",   subtitle: "Workflow performance and execution insights." },
  "/ai-ops":     { title: "AI Operations", subtitle: "AI model activity and planning events." },
  "/settings":   { title: "Settings",    subtitle: "Application and workflow preferences." },
  "/demo":       { title: "Help",         subtitle: "Documentation and quick start guides." },
};

function getPageMeta(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/workflows/")) return { title: "Workflow Detail", subtitle: "Execution trace and results." };
  return { title: "FlowPilot AI", subtitle: "Intelligent Business Workflow Automation." };
}

/* ─────────────────────────────────────────────────
   TOPBAR COMPONENT
───────────────────────────────────────────────── */
export function Topbar() {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);
  const meta = getPageMeta(pathname);

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <header
      className="flex items-center h-14 px-6 gap-4 border-b flex-shrink-0 bg-white"
      style={{ borderColor: "var(--fp-border)" }}
    >
      {/* ── Page title ── */}
      <div className="flex-1 min-w-0">
        <h1
          className="text-[15px] font-semibold leading-none truncate"
          style={{ color: "var(--fp-text)" }}
        >
          {meta.title}
        </h1>
        <p
          className="text-[11px] mt-0.5 truncate hidden sm:block"
          style={{ color: "var(--fp-text-muted)" }}
        >
          {meta.subtitle}
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative hidden md:flex items-center">
        <Search
          className="absolute left-3 w-3.5 h-3.5 pointer-events-none"
          style={{ color: searchFocused ? "var(--fp-indigo)" : "var(--fp-text-faint)" }}
        />
        <input
          type="text"
          placeholder="Search FlowPilot…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="fp-input pl-9 pr-16 w-52"
          style={{
            fontSize: "12px",
            height: "34px",
            borderColor: searchFocused ? "var(--fp-indigo)" : "var(--fp-border)",
          }}
        />
        <span
          className="absolute right-3 flex items-center gap-0.5 text-[10px] font-medium"
          style={{ color: "var(--fp-text-faint)" }}
        >
          <Command className="w-2.5 h-2.5" />K
        </span>
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-md transition-colors relative"
          style={{ color: "var(--fp-text-muted)" }}
          title="Notifications"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--fp-surface-3)"; (e.currentTarget as HTMLElement).style.color = "var(--fp-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--fp-text-muted)"; }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--fp-indigo)" }}
          />
        </button>

        <button
          className="p-2 rounded-md transition-colors"
          style={{ color: "var(--fp-text-muted)" }}
          title="Help"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--fp-surface-3)"; (e.currentTarget as HTMLElement).style.color = "var(--fp-text)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--fp-text-muted)"; }}
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center ml-1 cursor-pointer"
          style={{ background: "var(--fp-indigo)" }}
          title="Account"
        >
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </header>
  );
}
