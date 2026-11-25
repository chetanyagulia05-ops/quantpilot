import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatPercent, formatVolume, getChangeColor } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { demoSectors } from '@/data/demo';
import type { TopMover } from '@/types';

// Indian & Global Market Indices
const MARKET_INDICES = [
  { symbol: 'NIFTY 50', name: 'NSE Benchmark', value: 22450.25, change: 162.80, change_pct: 0.73, region: 'India' },
  { symbol: 'SENSEX', name: 'BSE Benchmark', value: 73872.10, change: 535.15, change_pct: 0.73, region: 'India' },
  { symbol: 'BANK NIFTY', name: 'NSE Banking', value: 47920.40, change: 310.60, change_pct: 0.65, region: 'India' },
  { symbol: 'S&P 500', name: 'US Broad Market', value: 4783.83, change: 28.45, change_pct: 0.60, region: 'US' },
  { symbol: 'NASDAQ 100', name: 'US Tech Index', value: 16969.22, change: 145.20, change_pct: 0.86, region: 'US' },
];

const TOP_GAINERS: (TopMover & { currency: 'INR' | 'USD' })[] = [
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', price: 935.0, change: 31.2, change_pct: 3.45, volume: 18450000, currency: 'INR' },
  { symbol: 'INFY', name: 'Infosys Limited', price: 1625.0, change: 33.4, change_pct: 2.10, volume: 12100000, currency: 'INR' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2980.5, change: 54.1, change_pct: 1.85, volume: 14200000, currency: 'INR' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 682.35, change: 27.0, change_pct: 4.12, volume: 42000000, currency: 'USD' },
  { symbol: 'TCS', name: 'Tata Consultancy', price: 4120.0, change: 57.7, change_pct: 1.42, volume: 4800000, currency: 'INR' },
];

const TOP_LOSERS: (TopMover & { currency: 'INR' | 'USD' })[] = [
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 218.89, change: -5.15, change_pct: -2.30, volume: 68000000, currency: 'USD' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1642.0, change: -14.1, change_pct: -0.85, volume: 22000000, currency: 'INR' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 192.53, change: -0.81, change_pct: -0.42, volume: 38000000, currency: 'USD' },
  { symbol: 'ENPH', name: 'Enphase Energy', price: 108.23, change: -12.45, change_pct: -10.32, volume: 15000000, currency: 'USD' },
  { symbol: 'MRNA', name: 'Moderna', price: 89.56, change: -7.82, change_pct: -8.03, volume: 12000000, currency: 'USD' },
];

export default function Markets() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const moverColumns: Column<TopMover & { currency: 'INR' | 'USD' }>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (m) => (
        <button
          onClick={() => navigate(`/chart-lab?symbol=${m.symbol}`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-semibold text-text-primary group-hover:text-brand transition-colors">
            <span>{m.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-xs text-text-muted">{m.name}</span>
        </button>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (m) => <span className="font-mono font-medium">{formatCurrency(m.price, m.currency)}</span>,
    },
    {
      key: 'change',
      header: 'Change',
      align: 'right',
      render: (m) => (
        <span className={`font-mono font-medium ${getChangeColor(m.change)}`}>
          {m.change >= 0 ? '+' : ''}
          {formatCurrency(m.change, m.currency)}
        </span>
      ),
    },
    {
      key: 'change_pct',
      header: '%',
      align: 'right',
      render: (m) => (
        <Badge variant={m.change_pct >= 0 ? 'gain' : 'loss'}>
          {formatPercent(m.change_pct)}
        </Badge>
      ),
    },
    {
      key: 'volume',
      header: 'Volume',
      align: 'right',
      render: (m) => <span className="text-xs text-text-muted">{formatVolume(m.volume)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Market Pulse & Global Indices</h1>
          <p className="text-sm text-text-secondary">
            Broad market overview across NSE/BSE Indian benchmarks and US equity sectors
          </p>
        </div>
        <Badge variant="brand">Multi-Market Feed</Badge>
      </div>

      {/* Indices */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {MARKET_INDICES.map((idx) => (
          <StatCard
            key={idx.symbol}
            title={`${idx.symbol}`}
            value={idx.value.toLocaleString(idx.region === 'India' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}
            change={idx.change}
            changePct={idx.change_pct}
          />
        ))}
      </div>

      {/* Sector Performance */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Sector Performance Overview</h2>
          <p className="text-xs text-text-muted">Relative intraday performance by industry classification</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={demoSectors}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
            >
              <XAxis
                type="number"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={12}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke={isDark ? '#94a3b8' : '#64748b'}
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [`${Number(val).toFixed(2)}%`, 'Change']}
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="change_pct" radius={[0, 4, 4, 0]}>
                {demoSectors.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.change_pct >= 0 ? '#10b981' : '#ef4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gainers and Losers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gain">Top Daily Gainers</h2>
              <p className="text-xs text-text-muted">Highest percentage increases across tracked assets</p>
            </div>
            <Badge variant="gain">Leaders</Badge>
          </div>
          <DataTable
            columns={moverColumns}
            data={TOP_GAINERS}
            keyExtractor={(m) => m.symbol}
            compact
          />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-loss">Top Daily Laggards</h2>
              <p className="text-xs text-text-muted">Largest percentage pullbacks across tracked assets</p>
            </div>
            <Badge variant="loss">Laggards</Badge>
          </div>
          <DataTable
            columns={moverColumns}
            data={TOP_LOSERS}
            keyExtractor={(m) => m.symbol}
            compact
          />
        </Card>
      </div>
    </div>
  );
}
