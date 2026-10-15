import { useState } from 'react';
import { Search, SlidersHorizontal, LineChart as ChartIcon } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatPercent, formatVolume } from '@/lib/utils';
import { demoWatchlist, demoHoldings } from '@/data/demo';

export default function Research() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  // Combine items for screener display
  const screenerItems = [
    ...demoWatchlist.map((w) => ({
      symbol: w.symbol,
      name: w.name,
      price: w.current_price,
      change_pct: w.change_pct,
      volume: w.volume,
      market_cap: w.market_cap,
      sector: w.sector,
    })),
    ...demoHoldings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      price: h.current_price,
      change_pct: h.unrealized_pnl_pct,
      volume: 12500000,
      market_cap: 850000000000,
      sector: h.sector,
    })),
  ];

  const filteredItems = screenerItems.filter((item) => {
    const matchesSearch =
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector =
      selectedSector === 'ALL' || item.sector.toLowerCase() === selectedSector.toLowerCase();
    return matchesSearch && matchesSector;
  });

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Research</h1>
        <p className="text-sm text-text-secondary">Quantitative screening, fundamental metrics, and technical indicators</p>
      </div>

      {/* Screener Controls */}
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticker, company name (e.g. AAPL, NVIDIA)..."
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-text-muted" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="ALL">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Consumer Cyclical">Consumer Cyclical</option>
              <option value="Communication">Communication</option>
            </select>
          </div>
        </div>

        {/* Screener Cards Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, idx) => (
            <div
              key={`${item.symbol}-${idx}`}
              className="flex flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-all hover:border-brand/50 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-bold text-text-primary">{item.symbol}</span>
                    <p className="text-xs text-text-muted line-clamp-1">{item.name}</p>
                  </div>
                  <Badge variant={item.change_pct >= 0 ? 'gain' : 'loss'}>
                    {formatPercent(item.change_pct)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold">{formatCurrency(item.price)}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-border-light pt-3 flex items-center justify-between text-xs text-text-secondary">
                <span>Cap: {formatCurrency(item.market_cap, 'USD', true)}</span>
                <span>Vol: {formatVolume(item.volume)}</span>
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                  {item.sector}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Advanced Analysis Coming Soon */}
      <Card>
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-text-primary">Quantitative Modeling Engine</h2>
          <p className="text-xs text-text-muted">Monte Carlo simulations, RSI, MACD, and multi-factor models</p>
        </div>
        <EmptyState
          icon={<ChartIcon className="h-8 w-8 text-brand" />}
          title="FastAPI Quantitative Engine Integration"
          description="Algorithmic signal generators, statistical arbitrage tests, and machine-learning factors will be plugged into this research workbench in Milestone 6."
        />
      </Card>
    </div>
  );
}
