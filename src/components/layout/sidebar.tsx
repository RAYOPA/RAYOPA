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
  return (
    <div className="flex flex-col w-64 bg-slate-900 h-screen border-r border-slate-800">
      <div className="flex items-center h-16 px-6 border-b border-slate-800 bg-slate-950">
        <span className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Workflow className="w-6 h-6 text-blue-500" />
          FlowPilot AI
        </span>
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
