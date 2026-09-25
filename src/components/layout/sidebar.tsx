import Link from 'next/link';
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
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr && !window.location.pathname.startsWith('/login')) {
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

  return (
    <div className="flex flex-col w-64 bg-slate-900 h-screen border-r border-slate-800">
      <div className="flex items-center h-16 px-6 border-b border-slate-800 bg-slate-950">
        <span className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Workflow className="w-6 h-6 text-blue-500" />
          FlowPilot AI
        </span>
      </div>
      
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
        <div id="user-info" className="text-sm">
          <div className="text-slate-300 font-medium user-name">User</div>
          <div className="text-xs text-slate-500 user-role uppercase font-bold tracking-wider">Role</div>
        </div>
        <button 
          className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700"
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
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-colors group"
              >
                <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
