import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, LineChart as ChartIcon, ArrowUpRight } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { formatCurrency, formatPercent, formatVolume } from '@/lib/utils';
import { SUPPORTED_TICKERS } from '@/data/ohlcvData';

export default function Research() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('ALL');

  // Screener items derived from supported tickers
  const screenerItems = SUPPORTED_TICKERS.map((t) => {
    // Generate simulated 24h change & market cap for research view
    const changePct = t.symbol === 'RELIANCE' ? 1.85 :
      t.symbol === 'TCS' ? 1.42 :
      t.symbol === 'HDFCBANK' ? -0.85 :
      t.symbol === 'INFY' ? 2.10 :
      t.symbol === 'TATAMOTORS' ? 3.45 :
      t.symbol === 'NIFTY50' ? 0.72 :
      t.symbol === 'NVDA' ? 4.12 :
      t.symbol === 'AAPL' ? -0.42 :
      t.symbol === 'MSFT' ? 1.15 :
      t.symbol === 'TSLA' ? -2.30 : 0.82;

    const marketCap = t.currency === 'INR' ? (t.basePrice * 1000000000) : (t.basePrice * 2500000000);
    const volume = Math.round(t.basePrice * 45000);

    return {
      symbol: t.symbol,
      name: t.name,
      exchange: t.exchange,
      sector: t.sector,
      price: t.basePrice,
      currency: t.currency,
      change_pct: changePct,
      volume,
      market_cap: marketCap,
    };
  });

  const filteredItems = screenerItems.filter((item) => {
    const matchesSearch =
      item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExchange =
      selectedExchange === 'ALL' || item.exchange.toLowerCase().includes(selectedExchange.toLowerCase());
    return matchesSearch && matchesExchange;
  });

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Quantitative Research & Screener</h1>
          <p className="text-sm text-text-secondary">
            Multi-market screening across NSE/BSE Indian equities and US benchmarks
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<ChartIcon className="h-4 w-4" />}
          onClick={() => navigate('/chart-lab')}
        >
          Open Chart Lab
        </Button>
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
              placeholder="Search ticker, company name (e.g. RELIANCE, TCS, NVDA)..."
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-text-muted" />
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="ALL">All Exchanges (NSE & US)</option>
              <option value="NSE">NSE Indian Equities</option>
              <option value="NASDAQ">NASDAQ Equities</option>
              <option value="NYSE">NYSE / ETFs</option>
            </select>
          </div>
        </div>

        {/* Screener Cards Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.symbol}
              onClick={() => navigate(`/chart-lab?symbol=${item.symbol}`)}
              className="group flex flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-all hover:border-brand hover:shadow-md cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-text-primary group-hover:text-brand transition-colors">
                        {item.symbol}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-text-muted group-hover:text-brand transition-colors" />
                    </div>
                    <p className="text-xs text-text-muted line-clamp-1">{item.name}</p>
                  </div>
                  <Badge variant={item.change_pct >= 0 ? 'gain' : 'loss'}>
                    {formatPercent(item.change_pct)}
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-xl font-bold text-text-primary">
                    {formatCurrency(item.price, item.currency)}
                  </span>
                  <span className="text-xs text-text-muted font-medium">{item.exchange}</span>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-xs text-text-secondary">
                <span>Cap: {formatCurrency(item.market_cap, item.currency, true)}</span>
                <span>Vol: {formatVolume(item.volume)}</span>
                <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                  {item.sector}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Advanced Analysis Module */}
      <Card>
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-text-primary">Quantitative Modeling Engine</h2>
          <p className="text-xs text-text-muted">Monte Carlo simulations, RSI, MACD, and multi-factor algorithmic models</p>
        </div>
        <EmptyState
          icon={<ChartIcon className="h-8 w-8 text-brand" />}
          title="Python FastAPI Quantitative Engine Integration"
          description="Algorithmic signal generators, statistical arbitrage tests, and machine-learning factors will connect directly to this research workbench in Milestone 6."
        />
      </Card>
    </div>
  );
}
