// ============================================================
// QuantPilot — Professional Navigation Sidebar
// Responsive sidebar with desktop collapse and mobile drawer backdrop.
// ============================================================

import { NavLink } from 'react-router-dom';
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
  X,
} from 'lucide-react';

export const navItems = [
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
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-base font-bold tracking-tight text-text-primary">
                  Quant<span className="text-brand">Pilot</span>
                </span>
                <span className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Research Terminal
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand/10 text-brand shadow-2xs font-bold border-l-2 border-brand'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Terminal Info */}
        {!collapsed && (
          <div className="border-t border-border p-3">
            <div className="rounded-xl border border-border-light bg-surface-secondary p-2.5 text-[11px] text-text-muted space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-secondary">QuantPilot v0.2</span>
                <span className="rounded bg-brand/10 text-brand px-1.5 py-0.2 text-[9px] font-bold">
                  PAPER
                </span>
              </div>
              <p className="text-[10px]">NSE & Global Multi-User</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
