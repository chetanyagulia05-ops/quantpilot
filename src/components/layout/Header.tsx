// ============================================================
// QuantPilot — Institutional Top Header Bar
// Includes live market tick trigger, global search (Cmd+K),
// notifications drawer, theme toggle, and 5-user switcher.
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, Bell, Play, Pause, StepForward, RefreshCw } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import MarketStatusPill from '@/components/common/MarketStatusPill';
import GlobalSearchModal from '@/components/common/GlobalSearchModal';
import NotificationsModal from '@/components/common/NotificationsModal';
import UserMenu from '@/components/common/UserMenu';
import { usePortfolio } from '@/context/PortfolioContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const {
    notifications,
    autoTickEnabled,
    setAutoTickEnabled,
    stepMarketTick,
    syncRealData,
    isSyncingData,
    lastMatchedNotice,
    clearLastMatchedNotice,
  } = usePortfolio();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!lastMatchedNotice) return;
    const t = window.setTimeout(clearLastMatchedNotice, 5000);
    return () => clearTimeout(t);
  }, [lastMatchedNotice, clearLastMatchedNotice]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left: Sidebar Toggle & Market Status */}
        <div className="flex items-center gap-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={onMenuToggle}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="h-4 w-4" />
          </motion.button>

          <MarketStatusPill />

          {/* Live Tick Simulation Controls */}
          <div className="hidden xl:flex items-center gap-1 rounded-md border border-border bg-secondary/60 p-0.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => syncRealData(true)}
              disabled={isSyncingData}
              title="Sync real market quotes & OHLCV from Yahoo Finance"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-foreground hover:bg-card transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 text-gain ${isSyncingData ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => stepMarketTick()}
              title="Advance simulated market quotes by 1 tick & run order matcher"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-foreground hover:bg-card transition-colors cursor-pointer"
            >
              <StepForward className="h-3 w-3 text-brand" />
              <span>Tick</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoTickEnabled(!autoTickEnabled)}
              title="Toggle continuous 4s live market tick stream"
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                autoTickEnabled
                  ? 'bg-gain-light text-gain'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {autoTickEnabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{autoTickEnabled ? 'Live' : 'Stream'}</span>
            </motion.button>
          </div>
        </div>

        {/* Center: Global Command Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <motion.button
            type="button"
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsSearchOpen(true)}
            className="flex w-full items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-brand/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Jump to ticker, chart, or order desk...</span>
            </div>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </motion.button>
        </div>

        {/* Right: Mobile Search + Notifications + Theme + Account */}
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Search stocks"
          >
            <Search className="h-4 w-4" />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsNotifOpen(true)}
            className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
            )}
          </motion.button>

          <ThemeToggle />
          <div className="h-4 w-px bg-border mx-1" />
          <UserMenu />
        </div>
      </header>

      {/* Matched Order Execution Toast */}
      <AnimatePresence>
        {lastMatchedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
            role="status"
            className="fixed top-16 right-4 z-40 rounded-md border border-gain/40 bg-card px-3.5 py-2.5 text-xs font-medium text-foreground shadow-lg"
          >
            <span className="font-mono font-semibold text-gain mr-2">FILL</span>
            {lastMatchedNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
