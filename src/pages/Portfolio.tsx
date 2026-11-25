import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { portfolio, holdings, currency } = usePortfolio();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Aggregate allocations by sector from live holdings
  const sectorAllocations = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holdings) {
      map.set(h.sector, (map.get(h.sector) || 0) + h.market_value);
    }
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));
  }, [holdings]);

  const holdingColumns: Column<Holding>[] = [
    {
      key: 'symbol',
      header: 'Asset',
      render: (h) => (
        <button
          onClick={() => navigate(`/chart-lab?symbol=${h.symbol}`)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1 font-semibold text-text-primary group-hover:text-brand transition-colors">
            <span>{h.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="block text-xs text-text-muted">{h.name}</span>
        </button>
      ),
    },
    {
      key: 'sector',
      header: 'Sector',
      render: (h) => <Badge variant="neutral">{h.sector}</Badge>,
    },
    {
      key: 'quantity',
      header: 'Units',
      align: 'right',
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
      header: 'Current Price',
      align: 'right',
      render: (h) => <span className="font-mono font-medium">{formatCurrency(h.current_price, currency)}</span>,
    },
    {
      key: 'market_value',
      header: 'Market Value',
      align: 'right',
      render: (h) => <span className="font-mono font-semibold">{formatCurrency(h.market_value, currency)}</span>,
    },
    {
      key: 'unrealized_pnl',
      header: 'Total P&L',
      align: 'right',
      render: (h) => (
        <div className="flex flex-col items-end">
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
      render: (h) => <span className="font-mono text-text-secondary">{h.allocation_pct}%</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Portfolio Holdings & Ledger</h1>
          <p className="text-sm text-text-secondary">
            Simulated portfolio ledger for <span className="font-semibold text-text-primary">{currentUser.name}</span>
          </p>
        </div>
        <Badge variant="brand">Ledger Status: Reconciled</Badge>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Portfolio Value"
          value={portfolio.total_value}
          isCurrency
          currency={currency}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title="Unrealized Total P&L"
          value={portfolio.total_pnl}
          isCurrency
          currency={currency}
          change={portfolio.total_pnl}
          changePct={portfolio.total_pnl_pct}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Available Buying Power"
          value={portfolio.cash_balance}
          isCurrency
          currency={currency}
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
                  formatter={(v) => [formatCurrency(Number(v) || 0, currency), 'Value']}
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '0.5rem',
                  }}
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
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Holdings Breakdown</h2>
                <p className="text-xs text-text-muted">{holdings.length} active positions in isolated ledger</p>
              </div>
              <Badge variant="neutral">{holdings.length} Positions</Badge>
            </div>
            <DataTable
              columns={holdingColumns}
              data={holdings}
              keyExtractor={(h) => h.id}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
