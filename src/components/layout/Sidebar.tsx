// ============================================================
// QuantPilot — Institutional Navigation Sidebar
// Uses Motion layoutId active rail + tactile click physics.
// ============================================================

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  TrendingUp,
  LineChart,
  Briefcase,
  ArrowLeftRight,
  FlaskConical,
  Newspaper,
  Bot,
  Settings,
  Terminal,
  X,
} from 'lucide-react';

export const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Markets', path: '/markets', icon: TrendingUp },
  { label: 'Chart Lab', path: '/chart-lab', icon: LineChart },
  { label: 'Portfolio & Risk', path: '/portfolio', icon: Briefcase },
  { label: 'Paper Trading', path: '/paper-trading', icon: ArrowLeftRight },
  { label: 'Backtest Lab', path: '/research', icon: FlaskConical },
  { label: 'Macro & News', path: '/news', icon: Newspaper },
  { label: 'Quant AI', path: '/ai-assistant', icon: Bot },
  { label: 'Workspace & API', path: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-primary text-primary-foreground">
              <Terminal className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block text-sm font-semibold tracking-tight text-foreground">
                  QuantPilot
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Research Desk
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onMobileClose}
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Primary navigation" className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navItems.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                onClick={onMobileClose}
                title={collapsed ? label : undefined}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 550, damping: 32 }}
                  className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      className="absolute inset-0 rounded-md border border-border bg-secondary"
                    />
                  )}
                  <Icon className={`relative z-10 h-4 w-4 shrink-0 ${isActive ? 'text-brand' : ''}`} />
                  {!collapsed && <span className="relative z-10 truncate">{label}</span>}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Terminal Spec */}
        {!collapsed && (
          <div className="border-t border-border p-3">
            <div className="rounded-md border border-border bg-secondary/50 px-2.5 py-2 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-foreground">v2.0.0</span>
                <span className="rounded border border-brand/30 bg-brand/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-brand">
                  SIM-LIVE
                </span>
              </div>
              <p className="text-[10px]">NSE · NASDAQ · Multi-User RLS</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
