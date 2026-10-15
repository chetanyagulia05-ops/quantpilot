import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatPercent, formatVolume, getChangeColor } from '@/lib/utils';
import {
  demoMarketIndices,
  demoSectors,
  demoTopGainers,
  demoTopLosers,
} from '@/data/demo';
import type { TopMover } from '@/types';

export default function Markets() {
  const moverColumns: Column<TopMover>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (m) => (
        <div>
          <span className="font-semibold text-text-primary">{m.symbol}</span>
          <span className="block text-xs text-text-muted">{m.name}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (m) => <span className="font-medium">{formatCurrency(m.price)}</span>,
    },
    {
      key: 'change',
      header: 'Change',
      align: 'right',
      render: (m) => (
        <span className={`font-medium ${getChangeColor(m.change)}`}>
          {m.change >= 0 ? '+' : ''}
          {formatCurrency(m.change)}
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Markets</h1>
        <p className="text-sm text-text-secondary">Market overview, sector performance and daily movers</p>
      </div>

      {/* Indices */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoMarketIndices.map((idx) => (
          <StatCard
            key={idx.symbol}
            title={`${idx.name} (${idx.symbol})`}
            value={idx.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            change={idx.change}
            changePct={idx.change_pct}
          />
        ))}
      </div>

      {/* Sector Performance */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Sector Performance</h2>
          <p className="text-xs text-text-muted">Relative intraday performance by industry classification</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={demoSectors}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                formatter={(val) => [`${Number(val).toFixed(2)}%`, 'Change']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
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
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gain">Top Gainers</h2>
            <p className="text-xs text-text-muted">Highest simulated percentage increases</p>
          </div>
          <DataTable
            columns={moverColumns}
            data={demoTopGainers}
            keyExtractor={(m) => m.symbol}
            compact
          />
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-loss">Top Losers</h2>
            <p className="text-xs text-text-muted">Largest simulated percentage decreases</p>
          </div>
          <DataTable
            columns={moverColumns}
            data={demoTopLosers}
            keyExtractor={(m) => m.symbol}
            compact
          />
        </Card>
      </div>
    </div>
  );
}
