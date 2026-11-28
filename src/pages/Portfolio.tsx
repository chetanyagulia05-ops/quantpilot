// ============================================================
// QuantPilot — Portfolio Allocation & Institutional Risk Analytics
// Powered by real Yahoo Finance time-series + NumPy/Pandas:
// - Rolling Sharpe, Volatility & Beta vs Benchmark (NIFTY50 / SPY)
// - Historical Portfolio vs Benchmark Equity & Drawdown
// - Pandas Correlation Matrix & Marginal Risk Attribution
// - Stress Scenarios & Mean-Variance Efficient Frontier
// - 200-Path Monte Carlo GBM Forecast
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from 'recharts';
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
  Activity,
  Gauge,
} from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { quantApi, type PortfolioRiskResponse } from '@/lib/api';
import type { Holding } from '@/types';

const SECTOR_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'];

type RiskTab = 'ROLLING' | 'DRAWDOWN' | 'CORRELATION' | 'ATTRIBUTION' | 'STRESS' | 'MONTECARLO';

export default function Portfolio() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { portfolio, holdings, currency, syncRealData, isSyncingData } = usePortfolio();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [riskData, setRiskData] = useState<PortfolioRiskResponse | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskTab, setRiskTab] = useState<RiskTab>('ROLLING');

  const fetchRisk = useCallback(async () => {
    setLoadingRisk(true);
    try {
      const res = await quantApi.getPortfolioRisk(currentUser.id, 60);
      setRiskData(res);
    } catch {
      // handled gracefully
    } finally {
      setLoadingRisk(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk, holdings.length]);

  const handleRefreshAll = async () => {
    await syncRealData(true);
    await fetchRisk();
  };

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
          <span className="block text-[10px] text-muted-foreground">{h.sector}</span>
        </button>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
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
      key: 'market_value',
      header: 'Value',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (h) => h.market_value,
      render: (h) => <span className="font-mono font-semibold">{formatCurrency(h.market_value, currency)}</span>,
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

  const m = riskData?.metrics;
  const benchSym = riskData?.benchmark_symbol ?? (currency === 'INR' ? 'NIFTY50' : 'SPY');

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Portfolio Allocation &amp; Risk Analytics
            </h1>
            {riskData?.data_source && (
              <Badge variant={riskData.data_source.startsWith('YAHOO') ? 'gain' : 'warning'}>
                {riskData.data_source.startsWith('YAHOO') ? 'Yahoo Finance Real Series' : 'Fallback Series'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            NumPy/Pandas covariance &amp; benchmark risk engine for{' '}
            <span className="font-semibold text-foreground">{currentUser.name}</span>
            {riskData?.date_range ? ` · Window ${riskData.date_range}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">Bench: {benchSym}</Badge>
          <Button
            variant="secondary"
            size="sm"
            loading={loadingRisk || isSyncingData}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={handleRefreshAll}
          >
            Sync &amp; Recompute
          </Button>
        </div>
      </div>

      {/* Primary KPI Strip (6 institutional cards in 2x3 grid for clean spacing) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Equity"
          value={portfolio.total_value}
          isCurrency
          currency={currency}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <StatCard
          title="Buying Power"
          value={portfolio.cash_balance}
          isCurrency
          currency={currency}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Sharpe Ratio"
          value={m?.sharpe_ratio ?? 0}
          decimals={2}
          subtitle={`Sortino ${m?.sortino_ratio.toFixed(2) ?? '—'}`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Annualized Vol"
          value={m?.annualized_volatility_pct ?? 0}
          suffix="%"
          subtitle={`Div Ratio ${riskData?.diversification_ratio?.toFixed(2) ?? '—'}x`}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Max Drawdown"
          value={m?.max_drawdown_pct ?? 0}
          suffix="%"
          subtitle={`Beta ${m?.beta?.toFixed(2) ?? '—'} vs ${benchSym}`}
          icon={<Gauge className="h-4 w-4" />}
        />
        <StatCard
          title="1D 95% CVaR"
          value={m?.cvar_95_pct ?? 0}
          suffix="%"
          subtitle={`99% CVaR ${m?.cvar_99_pct ?? 0}%`}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      {/* Secondary Quant Diagnostics Strip */}
      {m && (
        <Card padding="sm" className="bg-secondary/35">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 text-xs font-mono">
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Jensen Alpha</span>
              <span className={`font-semibold ${(m.jensens_alpha_pct ?? 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {formatPercent(m.jensens_alpha_pct ?? 0)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Info Ratio</span>
              <span className="font-semibold text-foreground">{(m.information_ratio ?? 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Tracking Err</span>
              <span className="font-semibold text-foreground">{(m.tracking_error_pct ?? 0).toFixed(2)}%</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Up / Down Cap</span>
              <span className="font-semibold text-foreground">
                {m.up_capture_pct ?? 100}% / {m.down_capture_pct ?? 100}%
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Omega Ratio</span>
              <span className="font-semibold text-foreground">{(m.omega_ratio ?? 1).toFixed(2)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Parametric VaR</span>
              <span className="font-semibold text-loss">{(m.parametric_var_95_pct ?? 0).toFixed(2)}%</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Skew / Kurt</span>
              <span className="font-semibold text-foreground">
                {(m.skewness ?? 0).toFixed(2)} / {(m.excess_kurtosis ?? 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Effective Bets</span>
              <span className="font-semibold text-brand">{riskData?.effective_num_bets?.toFixed(2) ?? '—'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Allocation Pie + Positions Table */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-foreground">Real-Time Sector Allocation</h2>
            <p className="text-[11px] text-muted-foreground">Marked-to-market capital weights</p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorAllocations}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={76}
                  paddingAngle={2}
                >
                  {sectorAllocations.map((_, idx) => (
                    <Cell key={idx} fill={SECTOR_COLORS[idx % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v) || 0, currency), 'Value']}
                  contentStyle={{
                    backgroundColor: isDark ? '#111114' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                    fontSize: '12px',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {sectorAllocations.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Active Positions Ledger</h2>
              <p className="text-[11px] text-muted-foreground">{holdings.length} open positions marked to real quotes</p>
            </div>
            <Badge variant="neutral">{holdings.length} Assets</Badge>
          </div>
          <DataTable
            caption="Active portfolio positions and mark-to-market P&L"
            columns={holdingColumns}
            data={holdings}
            keyExtractor={(h) => h.id}
            compact
          />
        </Card>
      </div>

      {/* Quantitative Risk Modeling Suite */}
      {riskData && (
        <Card>
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Quantitative Risk Indicator Modules
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Rolling Sharpe/Beta/Vol, Drawdown, Pandas Correlation, Marginal Risk Attribution, Stress Tests &amp; Efficient Frontier
              </p>
            </div>
            <div className="overflow-x-auto pb-1">
              <SegmentedControl
                layoutId="portfolio-risk-tab"
                size="sm"
                value={riskTab}
                onChange={setRiskTab}
                options={[
                  { value: 'ROLLING', label: 'Rolling' },
                  { value: 'DRAWDOWN', label: 'Drawdown' },
                  { value: 'CORRELATION', label: 'Correlation' },
                  { value: 'ATTRIBUTION', label: 'Attribution' },
                  { value: 'STRESS', label: 'Stress & EF' },
                  { value: 'MONTECARLO', label: 'Monte Carlo' },
                ]}
              />
            </div>
          </div>

          {riskTab === 'ROLLING' && (
            <div className="h-72 w-full">
              {riskData.rolling_series.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskData.rolling_series} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" minTickGap={25} />
                    <YAxis yAxisId="sharpe" tick={{ fontSize: 11 }} stroke="#10b981" />
                    <YAxis yAxisId="vol" orientation="right" tick={{ fontSize: 11 }} stroke="#f59e0b" tickFormatter={(v) => `${v}%`} />
                    <ReferenceLine yAxisId="sharpe" y={0} stroke="#71717a" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#111114' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        fontSize: '12px',
                        borderRadius: '6px',
                      }}
                    />
                    <Line yAxisId="sharpe" type="monotone" dataKey="rolling_sharpe" name="Rolling Sharpe (20D)" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line yAxisId="sharpe" type="monotone" dataKey="rolling_beta" name={`Rolling Beta vs ${benchSym}`} stroke="#0ea5e9" strokeWidth={1.6} dot={false} />
                    <Line yAxisId="vol" type="monotone" dataKey="rolling_volatility_pct" name="Rolling Ann. Vol %" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Python quant engine required for rolling risk series.
                </div>
              )}
            </div>
          )}

          {riskTab === 'DRAWDOWN' && (
            <div className="h-72 w-full">
              {riskData.rolling_series.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskData.rolling_series} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" minTickGap={25} />
                    <YAxis tick={{ fontSize: 11 }} stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(val) => `${Number(val).toFixed(2)}%`}
                      contentStyle={{
                        backgroundColor: isDark ? '#111114' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        fontSize: '12px',
                        borderRadius: '6px',
                      }}
                    />
                    <Area type="monotone" dataKey="drawdown_pct" name="Portfolio Drawdown" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={1.8} />
                    <Area type="monotone" dataKey="benchmark_drawdown_pct" name={`${benchSym} Drawdown`} stroke="#71717a" fillOpacity={0} strokeDasharray="4 4" strokeWidth={1.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Python quant engine required for drawdown comparison.
                </div>
              )}
            </div>
          )}

          {riskTab === 'CORRELATION' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-muted-foreground">Asset</th>
                    {riskData.correlation_matrix.symbols.map((sym) => (
                      <th key={sym} className="p-2 text-center text-muted-foreground">
                        {sym}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {riskData.correlation_matrix.symbols.map((rowSym, rIdx) => (
                    <tr key={rowSym} className="border-t border-border">
                      <td className="p-2 font-semibold text-foreground">{rowSym}</td>
                      {riskData.correlation_matrix.matrix[rIdx].map((corr, cIdx) => {
                        const intensity = Math.min(0.65, Math.abs(corr) * 0.55);
                        const bg =
                          corr >= 0
                            ? `rgba(14, 165, 233, ${intensity})`
                            : `rgba(239, 68, 68, ${intensity})`;
                        return (
                          <td
                            key={cIdx}
                            className="p-2 text-center font-medium text-foreground"
                            style={{ backgroundColor: bg }}
                          >
                            {corr.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {riskTab === 'ATTRIBUTION' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData.risk_contributions} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                    <XAxis dataKey="symbol" tick={{ fontSize: 11 }} stroke="#71717a" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#111114' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        fontSize: '12px',
                        borderRadius: '6px',
                      }}
                    />
                    <Bar dataKey="weight_pct" name="Capital Weight %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="risk_contribution_pct" name="Marginal Risk %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <DataTable
                caption="Per-asset volatility, beta, and risk contribution"
                data={riskData.risk_contributions}
                keyExtractor={(r) => r.symbol}
                compact
                columns={[
                  { key: 'symbol', header: 'Asset', render: (r) => <span className="font-mono font-semibold">{r.symbol}</span> },
                  { key: 'weight_pct', header: 'Weight', align: 'right', render: (r) => <span className="font-mono">{r.weight_pct}%</span> },
                  { key: 'risk_contribution_pct', header: 'Risk Share', align: 'right', render: (r) => <span className="font-mono text-warning font-semibold">{r.risk_contribution_pct}%</span> },
                  { key: 'standalone_vol_pct', header: 'Ann. Vol', align: 'right', render: (r) => <span className="font-mono">{r.standalone_vol_pct}%</span> },
                  { key: 'beta', header: 'Beta', align: 'right', render: (r) => <span className="font-mono">{(r.beta ?? 1).toFixed(2)}</span> },
                ]}
              />
            </div>
          )}

          {riskTab === 'STRESS' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="lg:col-span-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Portfolio Stress Scenarios
                </h3>
                <div className="space-y-2">
                  {(riskData.stress_scenarios ?? []).map((sc) => (
                    <div
                      key={sc.scenario}
                      className="flex items-center justify-between rounded-md border border-border bg-secondary/35 px-3 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{sc.scenario}</p>
                        <p className="text-[11px] text-muted-foreground">{sc.shock_assumption}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="block font-semibold text-loss">
                          {formatCurrency(sc.estimated_pnl, currency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {sc.estimated_impact_pct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mean-Variance Efficient Frontier (Risky Assets)
                  </h3>
                  {riskData.efficient_frontier?.max_sharpe && (
                    <Badge variant="gain">
                      Max Sharpe {riskData.efficient_frontier.max_sharpe.sharpe.toFixed(2)}
                    </Badge>
                  )}
                </div>

                {riskData.efficient_frontier && riskData.efficient_frontier.cloud.length > 0 ? (
                  <>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
                          <XAxis type="number" dataKey="vol_pct" name="Vol %" unit="%" tick={{ fontSize: 11 }} stroke="#71717a" domain={['auto', 'auto']} />
                          <YAxis type="number" dataKey="ret_pct" name="Return %" unit="%" tick={{ fontSize: 11 }} stroke="#71717a" domain={['auto', 'auto']} />
                          <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{
                              backgroundColor: isDark ? '#111114' : '#ffffff',
                              borderColor: isDark ? '#27272a' : '#e4e4e7',
                              fontSize: '11px',
                              borderRadius: '6px',
                            }}
                          />
                          <Scatter name="Simulated Portfolios" data={riskData.efficient_frontier.cloud} fill="rgba(14, 165, 233, 0.35)" />
                          {riskData.efficient_frontier.current && (
                            <Scatter name="Current Weights" data={[riskData.efficient_frontier.current]} fill="#f59e0b" />
                          )}
                          {riskData.efficient_frontier.max_sharpe && (
                            <Scatter name="Max Sharpe Optimal" data={[riskData.efficient_frontier.max_sharpe]} fill="#10b981" />
                          )}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    {riskData.efficient_frontier.max_sharpe?.weights && (
                      <div className="rounded-md border border-border bg-secondary/35 p-2.5 text-[11px] font-mono">
                        <span className="block text-[10px] uppercase text-muted-foreground mb-1">
                          Max-Sharpe Tangency Allocation Suggestion:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(riskData.efficient_frontier.max_sharpe.weights).map(([sym, wt]) => (
                            <span key={sym} className="rounded border border-border bg-card px-2 py-0.5">
                              {sym}: <strong className="text-gain">{wt}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center text-xs text-muted-foreground">
                    Hold at least 2 equities to plot the efficient frontier.
                  </div>
                )}
              </div>
            </div>
          )}

          {riskTab === 'MONTECARLO' && (
            <div className="h-72 w-full">
              {riskData.monte_carlo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskData.monte_carlo} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#71717a" tickFormatter={(d) => `D+${d}`} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#71717a"
                      tickFormatter={(v) => formatCurrency(v, currency, true)}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v), currency)}
                      contentStyle={{
                        backgroundColor: isDark ? '#111114' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        fontSize: '12px',
                        borderRadius: '6px',
                      }}
                    />
                    <Area type="monotone" dataKey="p95" name="95th Pct" stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
                    <Area type="monotone" dataKey="p75" name="75th Pct" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.12} />
                    <Area type="monotone" dataKey="p50" name="Median (P50)" stroke="#0ea5e9" strokeWidth={2} fillOpacity={0} />
                    <Area type="monotone" dataKey="p25" name="25th Pct" stroke="#f59e0b" fillOpacity={0} strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="p5" name="5th Pct (Tail)" stroke="#ef4444" fillOpacity={0} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Python quant engine required for Monte Carlo simulation.
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
