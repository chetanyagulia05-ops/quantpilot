// ============================================================
// QuantPilot — Global Stock & Ticker Command Palette (Cmd+K)
// Fast multi-exchange ticker lookup across Indian and global stocks.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, X } from 'lucide-react';
import { SUPPORTED_TICKERS, type TickerInfo } from '@/data/ohlcvData';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SUPPORTED_TICKERS.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.exchange.toLowerCase().includes(q) ||
      t.sector.toLowerCase().includes(q)
    );
  });

  const handleSelect = (ticker: TickerInfo) => {
    onClose();
    navigate(`/chart-lab?symbol=${ticker.symbol}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface-secondary">
          <Search className="h-5 w-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks by ticker, company, or exchange (e.g. RELIANCE, NVDA, TCS)..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No matching stocks or symbols found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((ticker) => (
                <button
                  key={ticker.symbol}
                  onClick={() => handleSelect(ticker)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs hover:bg-surface-secondary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors">
                      {ticker.symbol}
                    </span>
                    <Badge variant="neutral">{ticker.exchange}</Badge>
                    <span className="text-text-secondary truncate max-w-[200px]">
                      {ticker.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-text-primary">
                      {formatCurrency(ticker.basePrice, ticker.currency)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-border-light bg-surface-secondary/50 px-4 py-2 text-[11px] text-text-muted">
          <span>Press ESC to close</span>
          <span>Click to open in Chart Lab</span>
        </div>
      </div>
    </div>
  );
}
