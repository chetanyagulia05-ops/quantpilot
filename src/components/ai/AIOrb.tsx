// ============================================================
// QuantPilot — Persistent Conversational AI Orb
// Floating trigger that opens the in-page assistant panel.
// NEVER navigates away or changes the active route.
// ============================================================

import { useState, useEffect } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import AIPanel from './AIPanel';

export default function AIOrb() {
  const [isOpen, setIsOpen] = useState(false);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Orb Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close AI assistant panel' : 'Open QuantPilot AI assistant'}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${
            isOpen
              ? 'bg-surface border-2 border-border text-text-primary rotate-90 scale-95'
              : 'bg-brand text-white hover:scale-105 active:scale-95'
          }`}
        >
          {/* Subtle Ambient Breathing Glow (Respects reduced motion) */}
          {!isOpen && (
            <span
              className="absolute -inset-1 -z-10 rounded-full bg-brand/30 blur-md transition-opacity motion-safe:animate-pulse group-hover:opacity-100 opacity-60"
              aria-hidden="true"
            />
          )}

          {isOpen ? (
            <X className="h-6 w-6 transition-transform" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="h-6 w-6" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-300 motion-safe:animate-bounce" />
            </div>
          )}

          {/* Quick Tooltip on Hover */}
          {!isOpen && (
            <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary opacity-0 shadow-md transition-opacity group-hover:opacity-100 hidden sm:block">
              QuantPilot AI Copilot
            </span>
          )}
        </button>
      </div>

      {/* Floating Modal / Slide-Over Assistant Panel */}
      {isOpen && <AIPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}
