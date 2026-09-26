"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Workflow, CheckSquare, Activity,
  Database, FileText, Puzzle, BarChart2, Cpu,
  Shield, Settings, HelpCircle, ChevronLeft, ChevronRight,
  LogOut, User, Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────────
   NAVIGATION STRUCTURE
───────────────────────────────────────────────── */
const navGroups = [
  {
    label: "General",
    items: [
      { name: "Dashboard",   href: "/",            icon: LayoutDashboard },
      { name: "Workflows",   href: "/workflows",   icon: Workflow },
      { name: "Approvals",   href: "/approvals",   icon: CheckSquare },
      { name: "Activity",    href: "/audit",       icon: Activity },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Business Data",  href: "/data",       icon: Database },
      { name: "Documents",      href: "/templates",  icon: FileText },
      { name: "Integrations",   href: "/analyze",    icon: Puzzle },
      { name: "Analytics",      href: "/analytics",  icon: BarChart2 },
      { name: "AI Operations",  href: "/ai-ops",     icon: Cpu },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Audit Trail",  href: "/audit",      icon: Shield },
      { name: "Settings",     href: "/settings",   icon: Settings },
      { name: "Help",         href: "/demo",       icon: HelpCircle },
    ],
  },
];

/* ─────────────────────────────────────────────────
   SIDEBAR COMPONENT
───────────────────────────────────────────────── */
export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  /* Auth check + user load */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("user");
    if (
      !userStr &&
      !window.location.pathname.startsWith("/login") &&
      !window.location.pathname.startsWith("/signup")
    ) {
      window.location.href = "/login";
      return;
    }
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  /* Persist collapse preference */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("fp_sidebar_collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") localStorage.setItem("fp_sidebar_collapsed", String(next));
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  /* Hide on auth pages */
  if (pathname === "/login" || pathname === "/signup") return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside
      className="fp-sidebar flex flex-col h-screen bg-[var(--fp-sidebar-bg)] border-r border-white/[0.06] flex-shrink-0 relative z-30"
      style={{ width: collapsed ? 60 : 220 }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center h-14 px-4 border-b border-white/[0.06] flex-shrink-0"
        style={{ minWidth: 0 }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--fp-indigo)] flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-[13px] tracking-tight whitespace-nowrap overflow-hidden">
              FlowPilot <span className="text-[var(--fp-sidebar-muted)] font-normal">AI</span>
            </span>
          )}
        </div>
        {/* Collapse toggle */}
        <button
          onClick={handleCollapse}
          className="ml-auto p-1 rounded-md text-[var(--fp-sidebar-muted)] hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="px-2 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase text-[var(--fp-sidebar-muted)]">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] font-medium transition-all duration-150 group relative"
                  style={{
                    color:      active ? "#ffffff" : "var(--fp-sidebar-text)",
                    background: active ? "var(--fp-sidebar-active)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "var(--fp-sidebar-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Active indicator */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--fp-indigo)]"
                      style={{ marginLeft: -8 }}
                    />
                  )}
                  <item.icon
                    className="flex-shrink-0 w-4 h-4"
                    style={{ color: active ? "#ffffff" : "var(--fp-sidebar-muted)" }}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User profile ── */}
      <div className="border-t border-white/[0.06] p-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-[var(--fp-indigo)] flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">
                {user?.username ?? "User"}
              </div>
              <div className="text-[10px] text-[var(--fp-sidebar-muted)] uppercase tracking-wider truncate">
                {user?.role ?? "—"}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1 rounded text-[var(--fp-sidebar-muted)] hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
