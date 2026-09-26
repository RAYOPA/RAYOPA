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
    <div className="flex flex-col w-64 bg-white h-screen border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-100 bg-white">
        <span className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: '#5347CE' }}>
          <Workflow className="w-6 h-6" style={{ color: '#887CFD' }} />
          Nexus
        </span>
      </div>
      
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div id="user-info" className="text-sm">
          <div className="text-gray-900 font-semibold user-name">User</div>
          <div className="text-[11px] text-gray-500 user-role uppercase font-bold tracking-wider mt-0.5">Role</div>
        </div>
        <button 
          className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium shadow-sm"
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
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[#5347CE]/10 text-[#5347CE]' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[#5347CE]' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
