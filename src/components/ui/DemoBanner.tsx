// ============================================================
// QuantPilot — Live Market Data & Engine Telemetry Strip
// Displays live Yahoo Finance sync status alongside Node & Python engines.
// ============================================================

import { Activity } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';

export default function DemoBanner() {
  const { backendConnected, pythonQuantOnline, dataSource, quotes } = usePortfolio();
  const latestDate = quotes[0]?.lastTradeDate;
  const isRealFeed = dataSource.startsWith('YAHOO_FINANCE');

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/70 px-3 py-1.5 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-2">
        <Activity className={`h-3.5 w-3.5 ${isRealFeed ? 'text-gain' : 'text-brand'}`} />
        <span className="font-mono font-medium text-foreground">
          {isRealFeed ? 'REAL MARKET SYNC' : 'PAPER SIMULATION'}
        </span>
        <span className="hidden sm:inline text-border">·</span>
        <span className="hidden sm:inline">
          {isRealFeed
            ? `Yahoo Finance NSE/NASDAQ OHLCV${latestDate ? ` (as of ${latestDate})` : ''} · Simulated paper execution`
            : 'Deterministic execution & historical quant modeling'}
        </span>
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${backendConnected ? 'bg-gain' : 'bg-warning'}`} />
          {backendConnected ? 'API: Node/TS' : 'API: Local'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${pythonQuantOnline ? 'bg-gain' : 'bg-muted-foreground'}`} />
          {pythonQuantOnline ? 'Quant: NumPy/Pandas' : 'Quant: TS Engine'}
        </span>
      </div>
    </div>
  );
}
