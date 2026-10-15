import { Briefcase, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import {
  demoPortfolio,
  demoHoldings,
  demoWatchlist,
  demoPortfolioHistory,
} from '@/data/demo';
import type { Holding, WatchlistItem } from '@/types';

export default function Dashboard() {
  const holdingColumns: Column<Holding>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (h) => (
        <div>
          <span className="font-semibold text-text-primary">{h.symbol}</span>
          <span className="block text-xs text-text-muted">{h.sector}</span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (h) => <span className="text-text-secondary">{h.name}</span>,
    },
    {
      key: 'quantity',
      header: 'Shares',
      align: 'right',
      render: (h) => <span>{h.quantity}</span>,
    },
    {
      key: 'avg_cost',
      header: 'Avg Cost',
      align: 'right',
      render: (h) => <span>{formatCurrency(h.avg_cost)}</span>,
    },
    {
      key: 'current_price',
      header: 'Price',
      align: 'right',
      render: (h) => <span className="font-medium">{formatCurrency(h.current_price)}</span>,
    },
    {
      key: 'unrealized_pnl',
      header: 'P&L',
      align: 'right',
      render: (h) => (
        <div className="flex flex-col items-end">
          <span className={`font-medium ${getChangeColor(h.unrealized_pnl)}`}>
            {h.unrealized_pnl >= 0 ? '+' : ''}
            {formatCurrency(h.unrealized_pnl)}
          </span>
          <span className="text-xs">
            <Badge variant={h.unrealized_pnl >= 0 ? 'gain' : 'loss'}>
              {formatPercent(h.unrealized_pnl_pct)}
            </Badge>
          </span>
        </div>
      ),
    },
    {
      key: 'allocation_pct',
      header: 'Alloc',
      align: 'right',
      render: (h) => <span className="text-text-secondary">{h.allocation_pct}%</span>,
    },
  ];

  const watchlistColumns: Column<WatchlistItem>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (item) => (
        <div>
          <span className="font-semibold text-text-primary">{item.symbol}</span>
          <span className="block text-xs text-text-muted">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'current_price',
      header: 'Price',
      align: 'right',
      render: (item) => <span className="font-medium">{formatCurrency(item.current_price)}</span>,
    },
    {
      key: 'change_pct',
      header: '24h Change',
      align: 'right',
      render: (item) => (
        <Badge variant={item.change_pct >= 0 ? 'gain' : 'loss'}>
          {formatPercent(item.change_pct)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Portfolio overview and market summary</p>
      </div>

      {/* Metric StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio Value"
          value={demoPortfolio.total_value}
          isCurrency
          change={demoPortfolio.total_pnl}
          changePct={demoPortfolio.total_pnl_pct}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title="Cash Balance"
          value={demoPortfolio.cash_balance}
          isCurrency
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Today's P&L"
          value="+$1,842.35"
          changePct={1.46}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Total Holdings"
          value={`${demoHoldings.length} Positions`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Chart */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Portfolio Performance (Simulated)</h2>
            <p className="text-xs text-text-muted">Historical simulation vs S&P 500 benchmark</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              <span className="text-text-secondary">QuantPilot Demo Portfolio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-text-muted" />
              <span className="text-text-muted">Benchmark</span>
            </div>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={demoPortfolioHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tickLine={false} stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(val) => [formatCurrency(Number(val) || 0), 'Value']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid: Holdings & Watchlist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Holdings</h2>
                <p className="text-xs text-text-muted">Simulated active positions in demo portfolio</p>
              </div>
            </div>
            <DataTable
              columns={holdingColumns}
              data={demoHoldings}
              keyExtractor={(h) => h.id}
            />
          </Card>
        </div>

        <div>
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Watchlist</h2>
              <p className="text-xs text-text-muted">Targeted stocks under observation</p>
            </div>
            <DataTable
              columns={watchlistColumns}
              data={demoWatchlist}
              keyExtractor={(w) => w.id}
              compact
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
