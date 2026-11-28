// ============================================================
// QuantPilot — Market Pulse & Real-Time Global Indices
// Live Yahoo Finance indices, sector returns, and session movers.
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatPercent, formatVolume, getChangeColor } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { usePortfolio } from '@/context/PortfolioContext';
import { quantApi, type MarketQuote } from '@/lib/api';
import { demoSectors } from '@/data/demo';

interface LiveIndex {
  chartSymbol: string;
  symbol: string;
  name: string;
  value: number;
  change: number;
  change_pct: number;
  region: 'India' | 'US';
  lastTradeDate?: string;
}

export default function Markets() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { quotes, syncRealData, isSyncingData } = usePortfolio();
  const isDark = resolvedTheme === 'dark';

  const [indices, setIndices] = useState<LiveIndex[]>([
    { chartSymbol: 'NIFTY50', symbol: 'NIFTY 50', name: 'NSE Benchmark', value: 25607.2, change: -277.3, change_pct: -1.07, region: 'India' },
    { chartSymbol: 'SENSEX', symbol: 'SENSEX', name: 'BSE Benchmark', value: 83339.26, change: -885.1, change_pct: -1.05, region: 'India' },
    { chartSymbol: 'BANKNIFTY', symbol: 'BANK NIFTY', name: 'NSE Banking', value: 63040.9, change: -420.5, change_pct: -0.66, region: 'India' },
    { chartSymbol: 'SPX', symbol: 'S&P 500', name: 'US Broad Market', value: 7297.49, change: 18.4, change_pct: 0.25, region: 'US' },
    { chartSymbol: 'NDX', symbol: 'NASDAQ 100', name: 'US Tech Index', value: 26726.39, change: 92.1, change_pct: 0.35, region: 'US' },
  ]);
  const [sectors, setSectors] = useState<Array<{ name: string; change_pct: number }>>(
    demoSectors.map((s) => ({ name: s.name, change_pct: s.change_pct }))
  );
  const [overviewSource, setOverviewSource] = useState('INITIAL_SNAPSHOT');
  const [loadingOverview, setLoadingOverview] = useState(false);

  const loadOverview = useCallback(async (refresh = false) => {
    setLoadingOverview(true);
    try {
      const res = await quantApi.getMarketOverview(refresh);
      if (res.indices?.length) setIndices(res.indices);
      if (res.sectors?.length) setSectors(res.sectors);
      setOverviewSource(res.data_source || 'YAHOO_FINANCE_LIVE');
    } catch {
      // keep existing
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(false);
  }, [loadOverview]);

  const handleSyncLive = async () => {
    await Promise.all([syncRealData(true), loadOverview(true)]);
  };

  const { gainers, laggards } = useMemo(() => {
    const equitiesOnly = quotes.filter(
      (q) => !['NIFTY50', 'SENSEX', 'BANKNIFTY', 'SPX', 'NDX'].includes(q.symbol)
    );
    const sorted = [...equitiesOnly].sort((a, b) => b.changePct - a.changePct);
    return {
      gainers: sorted.slice(0, 5),
      laggards: [...sorted].reverse().slice(0, 5),
    };
  }, [quotes]);

  const moverColumns: Column<MarketQuote>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (m) => (
        <button
          type="button"
          onClick={() => navigate(`/chart-lab?symbol=${m.symbol}&tf=1D`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-mono font-semibold text-foreground group-hover:text-brand">
            <span>{m.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-[11px] text-muted-foreground">{m.name}</span>
        </button>
      ),
    },
    {
      key: 'lastPrice',
      header: 'Last Px',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (m) => m.lastPrice,
      render: (m) => <span className="font-mono font-medium">{formatCurrency(m.lastPrice, m.currency)}</span>,
    },
    {
      key: 'change',
      header: 'Net Chg',
      align: 'right',
      render: (m) => (
        <span className={`font-mono font-medium ${getChangeColor(m.change)}`}>
          {m.change >= 0 ? '+' : ''}
          {formatCurrency(m.change, m.currency)}
        </span>
      ),
    },
    {
      key: 'changePct',
      header: '%',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (m) => m.changePct,
      render: (m) => (
        <Badge variant={m.changePct >= 0 ? 'gain' : 'loss'}>
          {formatPercent(m.changePct)}
        </Badge>
      ),
    },
    {
      key: 'volume',
      header: 'Volume',
      align: 'right',
      render: (m) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatVolume(m.volume, m.currency === 'INR')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Market Pulse &amp; Global Indices
            </h1>
            <Badge variant={overviewSource.startsWith('YAHOO') ? 'gain' : 'warning'}>
              {overviewSource.startsWith('YAHOO') ? 'Yahoo Finance Live' : 'Cached'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time synchronized benchmarks across NSE/BSE India &amp; US equities · Click any index to open its 1D intraday chart
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={loadingOverview || isSyncingData}
          icon={<RefreshCw className="h-3.5 w-3.5 text-gain" />}
          onClick={handleSyncLive}
        >
          Sync Live Feed
        </Button>
      </div>

      {/* Live Indices (clickable -> Chart Lab 1D intraday) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {indices.map((idx) => (
          <button
            key={idx.symbol}
            type="button"
            onClick={() => navigate(`/chart-lab?symbol=${idx.chartSymbol}&tf=1D`)}
            className="text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            title={`Open ${idx.symbol} intraday chart in Chart Lab`}
          >
            <StatCard
              title={idx.symbol}
              value={idx.value.toLocaleString(idx.region === 'India' ? 'en-IN' : 'en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              change={idx.change}
              changePct={idx.change_pct}
              className="group-hover:border-brand/50"
            />
          </button>
        ))}
      </div>

      {/* Sector Performance */}
      <Card>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">Real Sector &amp; Benchmark Proxy Returns</h2>
          <p className="text-[11px] text-muted-foreground">Latest session return by NSE &amp; US market vertical</p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sectors}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 115, bottom: 4 }}
            >
              <XAxis type="number" stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} width={110} />
              <Tooltip
                formatter={(val) => [`${Number(val).toFixed(2)}%`, 'Return']}
                contentStyle={{
                  backgroundColor: isDark ? '#111114' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                  fontSize: '12px',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="change_pct" radius={[0, 4, 4, 0]}>
                {sectors.map((entry, index) => (
                  <Cell key={index} fill={entry.change_pct >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Live Leaders & Laggards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gain">Session Leaders</h2>
              <p className="text-[11px] text-muted-foreground">Strongest percentage gainers</p>
            </div>
            <Badge variant="gain">Top 5</Badge>
          </div>
          <DataTable
            caption="Session leading stocks"
            columns={moverColumns}
            data={gainers}
            keyExtractor={(m) => m.symbol}
            compact
          />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-loss">Session Laggards</h2>
              <p className="text-[11px] text-muted-foreground">Weakest percentage movers</p>
            </div>
            <Badge variant="loss">Bottom 5</Badge>
          </div>
          <DataTable
            caption="Session lagging stocks"
            columns={moverColumns}
            data={laggards}
            keyExtractor={(m) => m.symbol}
            compact
          />
        </Card>
      </div>
    </div>
  );
}
