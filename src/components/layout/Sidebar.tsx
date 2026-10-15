import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  LineChart,
  Briefcase,
  ArrowLeftRight,
  Search,
  Newspaper,
  Bot,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Markets', path: '/markets', icon: TrendingUp },
  { label: 'Chart Lab', path: '/chart-lab', icon: LineChart },
  { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
  { label: 'Paper Trading', path: '/paper-trading', icon: ArrowLeftRight },
  { label: 'Research', path: '/research', icon: Search },
  { label: 'News', path: '/news', icon: Newspaper },
  { label: 'AI Assistant', path: '/ai-assistant', icon: Bot },
  { label: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <Zap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">
            Quant<span className="text-brand">Pilot</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-surface-secondary p-3 text-xs text-text-muted">
            <p className="font-semibold text-text-secondary">QuantPilot v0.1</p>
            <p className="mt-0.5">Paper Trading Mode</p>
          </div>
        </div>
      )}
    </aside>
  );
}
