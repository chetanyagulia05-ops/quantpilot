import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, TrendingUp, BarChart3, ArrowUpRight } from 'lucide-react';
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
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { demoWatchlist, demoPortfolioHistory } from '@/data/demo';
import type { Holding, WatchlistItem } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { portfolio, holdings, currency } = usePortfolio();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  // Scale historical performance points to match current portfolio total_value deterministically
  const scaledHistory = useMemo(() => {
    const scale = portfolio.total_value / 127845;
    return demoPortfolioHistory.map((pt) => ({
      date: pt.date,
      value: Math.round(pt.value * scale),
      benchmark: Math.round((pt.benchmark ?? pt.value) * scale),
    }));
  }, [portfolio.total_value]);

  const holdingColumns: Column<Holding>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (h) => (
        <button
          onClick={() => navigate(`/chart-lab?symbol=${h.symbol}`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-semibold text-text-primary group-hover:text-brand transition-colors">
            <span>{h.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-xs text-text-muted">{h.sector}</span>
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (h) => <span className="text-text-secondary text-sm">{h.name}</span>,
    },
    {
      key: 'quantity',
      header: 'Shares',
      align: 'right',
      render: (h) => <span className="font-mono text-sm">{h.quantity}</span>,
    },
    {
      key: 'avg_cost',
      header: 'Avg Cost',
      align: 'right',
      render: (h) => <span className="font-mono text-sm">{formatCurrency(h.avg_cost, currency)}</span>,
    },
    {
      key: 'current_price',
      header: 'Price',
      align: 'right',
      render: (h) => <span className="font-mono font-medium text-sm">{formatCurrency(h.current_price, currency)}</span>,
    },
    {
      key: 'unrealized_pnl',
      header: 'P&L',
      align: 'right',
      render: (h) => (
        <div className="flex flex-col items-end">
          <span className={`font-mono font-medium text-sm ${getChangeColor(h.unrealized_pnl)}`}>
            {h.unrealized_pnl >= 0 ? '+' : ''}
            {formatCurrency(h.unrealized_pnl, currency)}
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
      render: (h) => <span className="font-mono text-text-secondary text-sm">{h.allocation_pct}%</span>,
    },
  ];

  const watchlistColumns: Column<WatchlistItem>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (item) => (
        <button
          onClick={() => navigate(`/chart-lab?symbol=${item.symbol}`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-semibold text-text-primary group-hover:text-brand transition-colors">
            <span>{item.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-xs text-text-muted">{item.name}</span>
        </button>
      ),
    },
    {
      key: 'current_price',
      header: 'Price',
      align: 'right',
      render: (item) => (
        <span className="font-mono font-medium text-sm">
          {formatCurrency(item.current_price, currency === 'INR' && item.symbol.length <= 4 && !item.symbol.includes('NIFTY') ? 'USD' : currency)}
        </span>
      ),
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Financial Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Multi-asset portfolio overview for <span className="font-semibold text-text-primary">{currentUser.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">Active Account: {currentUser.role}</Badge>
        </div>
      </div>

      {/* Metric StatCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio Value"
          value={portfolio.total_value}
          isCurrency
          currency={currency}
          change={portfolio.total_pnl}
          changePct={portfolio.total_pnl_pct}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title="Cash Balance"
          value={portfolio.cash_balance}
          isCurrency
          currency={currency}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Total Unrealized P&L"
          value={portfolio.total_pnl}
          isCurrency
          currency={currency}
          change={portfolio.total_pnl}
          changePct={portfolio.total_pnl_pct}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Active Positions"
          value={`${holdings.length} Positions`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Chart */}
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Portfolio Performance (Simulated)</h2>
            <p className="text-xs text-text-muted">Historical simulation trajectory vs benchmark index</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              <span className="text-text-secondary">Portfolio Equity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-text-muted" />
              <span className="text-text-muted">Benchmark Index</span>
            </div>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scaledHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#334155' : '#e2e8f0'}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={12}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={12}
                tickFormatter={(v) => formatCurrency(v, currency, true)}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(val) => [formatCurrency(Number(val) || 0, currency), 'Equity']}
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderRadius: '0.5rem',
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
                stroke={isDark ? '#64748b' : '#94a3b8'}
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
                <h2 className="text-lg font-semibold text-text-primary">Portfolio Holdings</h2>
                <p className="text-xs text-text-muted">Simulated active positions with deterministic ledger accounting</p>
              </div>
              <Badge variant="neutral">{holdings.length} Assets</Badge>
            </div>
            <DataTable
              columns={holdingColumns}
              data={holdings}
              keyExtractor={(h) => h.id}
            />
          </Card>
        </div>

        <div>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Watchlist</h2>
                <p className="text-xs text-text-muted">Targeted equities under quant tracking</p>
              </div>
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
