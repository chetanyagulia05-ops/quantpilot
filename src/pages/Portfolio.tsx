import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { demoPortfolio, demoHoldings } from '@/data/demo';
import type { Holding } from '@/types';

const SECTOR_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export default function Portfolio() {
  // Aggregate allocations by sector
  const sectorAllocations = demoHoldings.reduce((acc, h) => {
    const existing = acc.find((s) => s.name === h.sector);
    if (existing) {
      existing.value += h.market_value;
    } else {
      acc.push({ name: h.sector, value: h.market_value });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const holdingColumns: Column<Holding>[] = [
    {
      key: 'symbol',
      header: 'Asset',
      render: (h) => (
        <div>
          <span className="font-semibold text-text-primary">{h.symbol}</span>
          <span className="block text-xs text-text-muted">{h.name}</span>
        </div>
      ),
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (h) => <Badge variant="neutral">{h.sector}</Badge>,
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
      header: 'Current Price',
      align: 'right',
      render: (h) => <span className="font-medium">{formatCurrency(h.current_price)}</span>,
    },
    {
      key: 'market_value',
      header: 'Market Value',
      align: 'right',
      render: (h) => <span className="font-semibold">{formatCurrency(h.market_value)}</span>,
    },
    {
      key: 'unrealized_pnl',
      header: 'Total P&L',
      align: 'right',
      render: (h) => (
        <div className="flex flex-col items-end">
          <span className={`font-semibold ${getChangeColor(h.unrealized_pnl)}`}>
            {h.unrealized_pnl >= 0 ? '+' : ''}
            {formatCurrency(h.unrealized_pnl)}
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
      render: (h) => <span className="text-text-secondary">{h.allocation_pct}%</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Portfolio</h1>
        <p className="text-sm text-text-secondary">Your paper holdings, portfolio distribution, and total return</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Portfolio Value"
          value={demoPortfolio.total_value}
          isCurrency
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title="Unrealized Total P&L"
          value={demoPortfolio.total_pnl}
          isCurrency
          change={demoPortfolio.total_pnl}
          changePct={demoPortfolio.total_pnl_pct}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Available Buying Power"
          value={demoPortfolio.cash_balance}
          isCurrency
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Allocation breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Sector Allocation</h2>
            <p className="text-xs text-text-muted">Capital distribution across industries</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorAllocations}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {sectorAllocations.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v) || 0), 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {sectorAllocations.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed Positions */}
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Holdings Breakdown</h2>
              <p className="text-xs text-text-muted">8 open paper-trading positions</p>
            </div>
            <DataTable
              columns={holdingColumns}
              data={demoHoldings}
              keyExtractor={(h) => h.id}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
