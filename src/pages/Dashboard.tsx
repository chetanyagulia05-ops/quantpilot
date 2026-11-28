// ============================================================
// QuantPilot — Institutional Overview Dashboard
// Real-data mark-to-market equity, live Yahoo Finance quote tape,
// historical portfolio trajectory vs benchmark, and holdings ledger.
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, TrendingUp, BarChart3, ArrowUpRight, FlaskConical, ArrowLeftRight } from 'lucide-react';
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
import Button from '@/components/ui/Button';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { quantApi } from '@/lib/api';
import { demoPortfolioHistory } from '@/data/demo';
import type { Holding } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { portfolio, holdings, quotes, currency } = usePortfolio();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [realHistory, setRealHistory] = useState<Array<{ date: string; value: number; benchmark: number }>>([]);
  const [benchmarkName, setBenchmarkName] = useState(currency === 'INR' ? 'NIFTY 50' : 'SPY');

  useEffect(() => {
    let active = true;
    quantApi
      .getPortfolioRisk(currentUser.id, 60)
      .then((res) => {
        if (!active) return;
        if (res.benchmark_symbol) {
          setBenchmarkName(res.benchmark_symbol === 'NIFTY50' ? 'NIFTY 50' : res.benchmark_symbol);
        }
        if (res.rolling_series && res.rolling_series.length > 0) {
          setRealHistory(
            res.rolling_series.slice(-90).map((pt) => ({
              date: pt.date,
              value: pt.equity,
              benchmark: pt.benchmark ?? pt.equity,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [currentUser.id, holdings.length]);

  const chartHistory = useMemo(() => {
    if (realHistory.length > 5) return realHistory;
    const scale = portfolio.total_value / 127845;
    return demoPortfolioHistory.map((pt) => ({
      date: pt.date,
      value: Math.round(pt.value * scale),
      benchmark: Math.round((pt.benchmark ?? pt.value) * scale),
    }));
  }, [realHistory, portfolio.total_value]);

  const globalTape = useMemo(
    () => quotes.filter((q) => ['NIFTY50', 'RELIANCE', 'TCS', 'NVDA', 'AAPL', 'MSFT', 'SPY'].includes(q.symbol)),
    [quotes]
  );

  const holdingColumns: Column<Holding>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      sortable: true,
      sortType: 'string',
      sortValue: (h) => h.symbol,
      render: (h) => (
        <button
          type="button"
          onClick={() => navigate(`/chart-lab?symbol=${h.symbol}`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-mono font-semibold text-foreground group-hover:text-brand">
            <span>{h.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-[11px] text-muted-foreground">{h.sector}</span>
        </button>
      ),
    },
    {
      key: 'quantity',
      header: 'Shares',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (h) => h.quantity,
      render: (h) => <span className="font-mono">{h.quantity}</span>,
    },
    {
      key: 'avg_cost',
      header: 'Avg Cost',
      align: 'right',
      render: (h) => <span className="font-mono">{formatCurrency(h.avg_cost, currency)}</span>,
    },
    {
      key: 'current_price',
      header: 'Mark Px',
      align: 'right',
      render: (h) => <span className="font-mono font-medium">{formatCurrency(h.current_price, currency)}</span>,
    },
    {
      key: 'unrealized_pnl',
      header: 'P&L',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (h) => h.unrealized_pnl,
      render: (h) => (
        <div className="flex flex-col items-end gap-0.5">
          <span className={`font-mono font-semibold ${getChangeColor(h.unrealized_pnl)}`}>
            {h.unrealized_pnl >= 0 ? '+' : ''}
            {formatCurrency(h.unrealized_pnl, currency)}
          </span>
          <Badge variant={h.unrealized_pnl >= 0 ? 'gain' : 'loss'}>
            {formatPercent(h.unrealized_pnl_pct)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'allocation_pct',
      header: 'Weight',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (h) => h.allocation_pct,
      render: (h) => <span className="font-mono text-muted-foreground">{h.allocation_pct}%</span>,
    },
  ];

  const quoteWatchColumns = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (item: (typeof quotes)[number]) => (
        <button
          type="button"
          onClick={() => navigate(`/chart-lab?symbol=${item.symbol}`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-mono font-semibold text-foreground group-hover:text-brand">
            <span>{item.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-[11px] text-muted-foreground">{item.exchange}</span>
        </button>
      ),
    },
    {
      key: 'lastPrice',
      header: 'Price',
      align: 'right' as const,
      render: (item: (typeof quotes)[number]) => (
        <span className="font-mono font-medium">
          {formatCurrency(item.lastPrice, item.currency)}
        </span>
      ),
    },
    {
      key: 'changePct',
      header: '24h',
      align: 'right' as const,
      render: (item: (typeof quotes)[number]) => (
        <Badge variant={item.changePct >= 0 ? 'gain' : 'loss'}>
          {formatPercent(item.changePct)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Research Overview</h1>
          <p className="text-xs text-muted-foreground">
            Multi-asset mark-to-market summary for{' '}
            <span className="font-semibold text-foreground">{currentUser.name}</span> · {currentUser.role}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<FlaskConical className="h-3.5 w-3.5 text-brand" />}
            onClick={() => navigate('/research')}
          >
            Backtest Lab
          </Button>
          <Button
            variant="brand"
            size="sm"
            icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
            onClick={() => navigate('/paper-trading')}
          >
            Trade Desk
          </Button>
        </div>
      </div>

      {/* Live Quote Tape */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {globalTape.map((q) => (
          <button
            key={q.symbol}
            type="button"
            onClick={() => navigate(`/chart-lab?symbol=${q.symbol}`)}
            className="flex shrink-0 items-center gap-2.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:border-brand/50 transition-colors cursor-pointer"
          >
            <span className="font-mono font-semibold text-foreground">{q.symbol}</span>
            <span className="font-mono text-muted-foreground">
              {formatCurrency(q.lastPrice, q.currency)}
            </span>
            <span className={`font-mono text-[11px] font-medium ${q.changePct >= 0 ? 'text-gain' : 'text-loss'}`}>
              {formatPercent(q.changePct)}
            </span>
          </button>
        ))}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Portfolio Equity"
          value={portfolio.total_value}
          isCurrency
          currency={currency}
          change={portfolio.total_pnl}
          changePct={portfolio.total_pnl_pct}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatCard
          title="Available Buying Power"
          value={portfolio.cash_balance}
          isCurrency
          currency={currency}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Net Portfolio P&L"
          value={portfolio.total_pnl}
          isCurrency
          currency={currency}
          change={portfolio.total_pnl}
          changePct={portfolio.total_pnl_pct}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Active Positions"
          value={`${holdings.length} Open`}
          subtitle={`Account ${currentUser.id}`}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* Real-Data Portfolio Trajectory Chart */}
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Historical Portfolio Trajectory vs {benchmarkName}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {realHistory.length > 5
                ? `Reconstructed from real Yahoo Finance daily returns (${realHistory[0].date} → ${realHistory[realHistory.length - 1].date})`
                : 'Historical simulated equity vs benchmark index'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="text-foreground">Portfolio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 bg-muted-foreground" />
              <span className="text-muted-foreground">{benchmarkName}</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartHistory} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="dashEquityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
              <XAxis dataKey="date" tickLine={false} stroke="#71717a" fontSize={11} minTickGap={24} />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickFormatter={(v) => formatCurrency(v, currency, true)}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(val, name) => [
                  formatCurrency(Number(val) || 0, currency),
                  name === 'value' ? 'Portfolio' : benchmarkName,
                ]}
                contentStyle={{
                  backgroundColor: isDark ? '#111114' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                  fontSize: '12px',
                  borderRadius: '6px',
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#dashEquityGrad)" />
              <Area type="monotone" dataKey="benchmark" stroke="#71717a" strokeDasharray="4 4" strokeWidth={1.3} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Holdings & Real-Time Watchlist */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Portfolio Holdings</h2>
                <p className="text-[11px] text-muted-foreground">Live mark-to-market ledger</p>
              </div>
              <Badge variant="neutral">{holdings.length} Positions</Badge>
            </div>
            <DataTable
              caption="Portfolio holdings and unrealized returns"
              columns={holdingColumns}
              data={holdings}
              keyExtractor={(h) => h.id}
              compact
            />
          </Card>
        </div>

        <div>
          <Card>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">Global Live Tape</h2>
              <p className="text-[11px] text-muted-foreground">Real-data US &amp; NSE watchlist</p>
            </div>
            <DataTable
              caption="Tracked US and NSE benchmark watchlist"
              columns={quoteWatchColumns}
              data={quotes.filter((q) => ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'SPY'].includes(q.symbol))}
              keyExtractor={(w) => w.symbol}
              compact
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
