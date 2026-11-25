// ============================================================
// QuantPilot — 5-User Profile & Account Switcher Menu
// Enforces complete user isolation between team accounts.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Check, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User account menu"
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 font-bold text-brand">
          {currentUser.avatarInitials}
        </div>
        <div className="text-left hidden md:block">
          <p className="font-semibold text-text-primary leading-tight">{currentUser.name}</p>
          <p className="text-[10px] text-text-muted">{currentUser.role}</p>
        </div>
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-64 rounded-2xl border border-border bg-surface p-2 shadow-2xl">
          {/* Active User Header */}
          <div className="border-b border-border-light px-3 py-2">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Active Authenticated Account
            </span>
            <p className="font-bold text-sm text-text-primary mt-0.5">{currentUser.name}</p>
            <p className="text-xs text-text-secondary">{currentUser.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-gain font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Isolated Paper Ledger ({currentUser.id})</span>
            </div>
          </div>

          {/* Switch Account Section */}
          <div className="py-2">
            <span className="px-3 text-[10px] uppercase font-bold text-text-muted tracking-wider block mb-1">
              Switch Team Seat (5 Users)
            </span>
            <div className="space-y-1">
              {allUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    currentUser.id === user.id
                      ? 'bg-brand/10 text-brand font-semibold'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-secondary text-[11px] font-bold text-text-primary border border-border">
                      {user.avatarInitials}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{user.name}</p>
                      <p className="text-[10px] text-text-muted">{user.role}</p>
                    </div>
                  </div>
                  {currentUser.id === user.id && <Check className="h-4 w-4 text-brand" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
