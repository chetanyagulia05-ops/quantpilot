// ============================================================
// QuantPilot — Global Stock & Ticker Command Palette (Cmd+K)
// Built on native <dialog> via NativeDialog (modern-web-guidance).
// ============================================================

import { useState, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, X } from 'lucide-react';
import NativeDialog from '@/components/ui/NativeDialog';
import Badge from '@/components/ui/Badge';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatCurrency } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const { quotes } = usePortfolio();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const filtered = quotes.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.exchange.toLowerCase().includes(q) ||
      t.sector.toLowerCase().includes(q)
    );
  });

  const handleSelect = (symbol: string) => {
    onClose();
    navigate(`/chart-lab?symbol=${symbol}`);
  };

  return (
    <NativeDialog isOpen={isOpen} onClose={onClose} ariaLabelledBy={titleId}>
      <h2 id={titleId} className="sr-only">
        Search market tickers and instruments
      </h2>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-secondary/50">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbol, company, exchange (e.g. RELIANCE, NVDA, TCS)..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ticker search"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No matching instruments found for &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((ticker) => (
              <button
                key={ticker.symbol}
                type="button"
                onClick={() => handleSelect(ticker.symbol)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs hover:bg-accent transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-semibold text-foreground group-hover:text-brand">
                    {ticker.symbol}
                  </span>
                  <Badge variant="neutral">{ticker.exchange}</Badge>
                  <span className="text-muted-foreground truncate">{ticker.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(ticker.lastPrice, ticker.currency)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-brand transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-2 text-[10px] font-mono text-muted-foreground">
        <span>ESC TO CLOSE</span>
        <span>SELECT TO OPEN IN CHART LAB</span>
      </div>
    </NativeDialog>
  );
}
