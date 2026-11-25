// ============================================================
// QuantPilot — Accessible Theme Toggle Component
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { mode: 'system', label: 'System', icon: <Laptop className="h-4 w-4" /> },
  ];

  const currentIcon =
    theme === 'system' ? (
      <Laptop className="h-4 w-4" />
    ) : resolvedTheme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Select theme, current theme is ${theme}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {currentIcon}
        {showLabel && (
          <span className="capitalize hidden sm:inline">{theme}</span>
        )}
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-1 w-36 rounded-xl border border-border bg-surface p-1 shadow-lg ring-1 ring-black/5"
        >
          {themeOptions.map((opt) => (
            <button
              key={opt.mode}
              role="menuitem"
              onClick={() => {
                setTheme(opt.mode);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                theme === opt.mode
                  ? 'bg-brand/10 text-brand font-semibold'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
              {theme === opt.mode && (
                <span className="ml-auto text-[10px] text-brand">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
