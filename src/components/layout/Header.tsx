// ============================================================
// QuantPilot — Professional Top Navigation Bar
// ============================================================

import { useState } from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import MarketStatusPill from '@/components/common/MarketStatusPill';
import GlobalSearchModal from '@/components/common/GlobalSearchModal';
import NotificationsModal from '@/components/common/NotificationsModal';
import UserMenu from '@/components/common/UserMenu';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: Sidebar Toggle & Market Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-xl p-2 text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <MarketStatusPill />
        </div>

        {/* Center: Global Stock Search Bar / Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-secondary/70 px-3.5 py-1.5 text-xs text-text-muted hover:border-brand/50 hover:bg-surface-secondary transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-text-muted" />
              <span>Search stocks, tickers (e.g. RELIANCE, NVDA)...</span>
            </div>
            <kbd className="hidden sm:inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Search mobile icon + Notifications + Theme Toggle + User Menu */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden rounded-xl p-2 text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
            aria-label="Search stocks"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Working Notifications Trigger */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative rounded-xl p-2 text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
          </button>

          {/* Theme Selector */}
          <ThemeToggle />

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* 5-User Account Menu */}
          <UserMenu />
        </div>
      </header>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
