"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Workflow, 
  CheckSquare, 
  Layers,
  FileText,
  Database,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Approvals', href: '/approvals', icon: CheckSquare },
  { name: 'Templates', href: '/templates', icon: Layers },
  { name: 'Audit Trail', href: '/audit', icon: FileText },
  { name: 'Data Sources', href: '/data', icon: Database },
  { name: 'Demo Script', href: '/demo', icon: LayoutDashboard },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      } else if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const nameEl = document.querySelector('.user-name');
          const roleEl = document.querySelector('.user-role');
          if (nameEl) nameEl.textContent = user.username;
          if (roleEl) roleEl.textContent = user.role;
        } catch(e) {}
      }
    }, 50);
  }

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <div className="flex flex-col w-64 bg-[#5347CE] h-screen border-r border-[#1e4d3c]">
      <div className="flex items-center h-16 px-6 border-b border-[#1e4d3c] bg-[#0c251c]">
        <span className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Workflow className="w-6 h-6 text-[#4896FE]" />
          FlowPilot AI
        </span>
      </div>
      
      <div className="px-6 py-4 border-b border-[#1e4d3c] flex justify-between items-center bg-[#1b4a39]/60">
        <div id="user-info" className="text-sm">
          <div className="text-[#ffffff] font-medium user-name">User</div>
          <div className="text-xs text-[#4896FE] user-role uppercase font-bold tracking-wider">Role</div>
        </div>
        <button 
          className="text-xs bg-[#887CFD] text-[#ffffff] px-2.5 py-1 rounded-md hover:bg-[#4896FE] hover:text-[#5347CE] transition-colors font-medium"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }}
        >
          Logout
        </button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#ffffff] rounded-lg hover:bg-[#887CFD] hover:text-white transition-colors group"
              >
                <item.icon className="w-5 h-5 text-[#4896FE] group-hover:text-white transition-colors" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
