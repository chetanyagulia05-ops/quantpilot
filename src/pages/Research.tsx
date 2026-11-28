// ============================================================
// QuantPilot — Algorithmic Backtest Lab & Multi-User Screener
// Executes real historical time-series backtests via Python
// NumPy/Pandas (with TypeScript fallback) and compares strategies.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Play,
  FlaskConical,
  Search,
  ArrowUpRight,
  LineChart as ChartIcon,
  Trophy,
  SlidersHorizontal,
} from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import SegmentedControl from '@/components/ui/SegmentedControl';
import DecryptedText from '@/components/reactbits/DecryptedText';
import AnimatedList from '@/components/reactbits/AnimatedList';
import { useAuth } from '@/context/AuthContext';
import { usePortfolio } from '@/context/PortfolioContext';
import { useTheme } from '@/context/ThemeContext';
import {
  quantApi,
  type BacktestResponse,
  type BacktestTradeRecord,
  type MultiUserLeaderboardResponse,
} from '@/lib/api';
import { formatCurrency, formatPercent, formatVolume } from '@/lib/utils';

type StrategyId =
  | 'SMA_CROSSOVER'
  | 'EMA_MOMENTUM'
  | 'RSI_MEAN_REVERSION'
  | 'BOLLINGER_BREAKOUT'
  | 'MACD_TREND';

const STRATEGY_OPTIONS: Array<{ id: StrategyId; label: string; desc: string }> = [
  { id: 'SMA_CROSSOVER', label: 'SMA Crossover', desc: 'Fast/Slow simple moving average trend cross' },
  { id: 'EMA_MOMENTUM', label: 'Dual EMA Momentum', desc: 'Exponential moving average trend following' },
  { id: 'RSI_MEAN_REVERSION', label: 'RSI Mean Reversion', desc: 'Wilder RSI oversold entry & overbought exit' },
  { id: 'BOLLINGER_BREAKOUT', label: 'Bollinger Reversion', desc: '2-sigma lower band entry & upper exit' },
  { id: 'MACD_TREND', label: 'MACD Signal Cross', desc: '12/26/9 MACD line crossover regime' },
];

export default function Research() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { quotes } = usePortfolio();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [workspaceTab, setWorkspaceTab] = useState<'BACKTEST' | 'LEADERBOARD' | 'SCREENER'>('BACKTEST');
  const [chartTab, setChartTab] = useState<'EQUITY' | 'ROLLING' | 'DRAWDOWN' | 'TRADES'>('EQUITY');

  // Backtest configuration state
  const [symbol, setSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState<StrategyId>('EMA_MOMENTUM');
  const [lookbackDays, setLookbackDays] = useState(252);
  const [initialCapital, setInitialCapital] = useState(500000);
  const [slippageBps, setSlippageBps] = useState(5);
  const [commissionBps, setCommissionBps] = useState(5);
  const [fastPeriod, setFastPeriod] = useState(12);
  const [slowPeriod, setSlowPeriod] = useState(26);
  const [rsiOversold, setRsiOversold] = useState(35);
  const [rsiOverbought, setRsiOverbought] = useState(68);

  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<MultiUserLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Screener filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('ALL');

  const executeBacktest = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const selectedQuote = quotes.find((q) => q.symbol === symbol);
      const rf = selectedQuote?.currency === 'USD' ? 0.0425 : 0.065;
      const res = await quantApi.runBacktest(currentUser.id, {
        symbol,
        strategy,
        lookback_days: lookbackDays,
        initial_capital: initialCapital,
        position_size_pct: 95,
        slippage_bps: slippageBps,
        commission_bps: commissionBps,
        risk_free_rate: rf,
        params: {
          fast_period: fastPeriod,
          slow_period: slowPeriod,
          rsi_period: 14,
          oversold: rsiOversold,
          overbought: rsiOverbought,
          bb_period: 20,
          bb_std: 2,
          signal_period: 9,
        },
      });
      setResult(res);
      const lb = await quantApi.getLeaderboard().catch(() => null);
      if (lb) setLeaderboard(lb);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Backtest execution failed.');
    } finally {
      setLoading(false);
    }
  }, [
    currentUser.id,
    symbol,
    strategy,
    lookbackDays,
    initialCapital,
    slippageBps,
    commissionBps,
    fastPeriod,
    slowPeriod,
    rsiOversold,
    rsiOverbought,
    quotes,
  ]);

  // Run initial backtest on mount so workbench opens populated
  useEffect(() => {
    executeBacktest();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (workspaceTab === 'LEADERBOARD') {
      quantApi.getLeaderboard().then(setLeaderboard).catch(() => {});
    }
  }, [workspaceTab]);

  const activeCurrency = result?.currency ?? quotes.find((q) => q.symbol === symbol)?.currency ?? 'INR';

  const tradeColumns: Column<BacktestTradeRecord>[] = [
    {
      key: 'entry_date',
      header: 'Entry',
      sortable: true,
      sortType: 'string',
      sortValue: (t) => t.entry_date,
      render: (t) => <span className="font-mono text-foreground">{t.entry_date}</span>,
    },
    {
      key: 'exit_date',
      header: 'Exit',
      sortable: true,
      sortType: 'string',
      sortValue: (t) => t.exit_date,
      render: (t) => <span className="font-mono text-muted-foreground">{t.exit_date}</span>,
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (t) => t.quantity,
      render: (t) => <span className="font-mono">{t.quantity}</span>,
    },
    {
      key: 'entry_price',
      header: 'Entry Px',
      align: 'right',
      render: (t) => <span className="font-mono">{formatCurrency(t.entry_price, activeCurrency)}</span>,
    },
    {
      key: 'exit_price',
      header: 'Exit Px',
      align: 'right',
      render: (t) => <span className="font-mono">{formatCurrency(t.exit_price, activeCurrency)}</span>,
    },
    {
      key: 'fees',
      header: 'Fees',
      align: 'right',
      render: (t) => <span className="font-mono text-muted-foreground">{formatCurrency(t.fees, activeCurrency)}</span>,
    },
    {
      key: 'pnl',
      header: 'Net P&L',
      align: 'right',
      sortable: true,
      sortType: 'number',
      sortValue: (t) => t.pnl,
      render: (t) => (
        <span className={`font-mono font-semibold ${t.pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
          {t.pnl >= 0 ? '+' : ''}
          {formatCurrency(t.pnl, activeCurrency)} ({formatPercent(t.pnl_pct)})
        </span>
      ),
    },
  ];

  const filteredQuotes = quotes.filter((item) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.sector.toLowerCase().includes(q);
    const matchesEx =
      selectedExchange === 'ALL' || item.exchange.toLowerCase().includes(selectedExchange.toLowerCase());
    return matchesSearch && matchesEx;
  });

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Algorithmic Backtest Lab
            </h1>
            {result?.engine_mode && (
              <Badge variant={result.engine_mode === 'python-numpy-pandas' ? 'gain' : 'info'}>
                <DecryptedText text={result.engine_mode.toUpperCase()} animateOn="view" />
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Historical time-series backtesting, rolling Sharpe, drawdown modeling &amp; multi-user evaluation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            layoutId="research-workspace-tab"
            value={workspaceTab}
            onChange={setWorkspaceTab}
            options={[
              { value: 'BACKTEST', label: 'Backtest Pipeline' },
              { value: 'LEADERBOARD', label: 'Multi-User Eval' },
              { value: 'SCREENER', label: 'Asset Screener' },
            ]}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<ChartIcon className="h-3.5 w-3.5" />}
            onClick={() => navigate(`/chart-lab?symbol=${symbol}`)}
          >
            Chart Lab
          </Button>
        </div>
      </div>

      {workspaceTab === 'BACKTEST' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Parameter Rail */}
          <Card className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-brand" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Pipeline Parameters
                </h2>
              </div>
              <Badge variant="neutral">No Look-Ahead</Badge>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeBacktest();
              }}
              className="space-y-3.5"
            >
              <div>
                <label htmlFor="bt-symbol" className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Target Instrument
                </label>
                <select
                  id="bt-symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {quotes.map((q) => (
                    <option key={q.symbol} value={q.symbol}>
                      {q.symbol} · {q.exchange} ({q.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bt-strategy" className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Algorithmic Strategy
                </label>
                <select
                  id="bt-strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as StrategyId)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STRATEGY_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {STRATEGY_OPTIONS.find((s) => s.id === strategy)?.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="bt-lookback" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Lookback (Bars)
                  </label>
                  <select
                    id="bt-lookback"
                    value={lookbackDays}
                    onChange={(e) => setLookbackDays(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={120}>120D (~6M)</option>
                    <option value={252}>252D (1Y)</option>
                    <option value={360}>360D (1.5Y)</option>
                    <option value={500}>500D (2Y)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="bt-capital" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Initial Capital
                  </label>
                  <input
                    id="bt-capital"
                    type="number"
                    min={10000}
                    step={10000}
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Math.max(1000, Number(e.target.value) || 100000))}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {(strategy === 'SMA_CROSSOVER' || strategy === 'EMA_MOMENTUM' || strategy === 'MACD_TREND') && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="bt-fast" className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Fast Window
                    </label>
                    <input
                      id="bt-fast"
                      type="number"
                      min={3}
                      max={60}
                      value={fastPeriod}
                      onChange={(e) => setFastPeriod(Math.max(3, Number(e.target.value) || 10))}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="bt-slow" className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Slow Window
                    </label>
                    <input
                      id="bt-slow"
                      type="number"
                      min={10}
                      max={200}
                      value={slowPeriod}
                      onChange={(e) => setSlowPeriod(Math.max(10, Number(e.target.value) || 26))}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {strategy === 'RSI_MEAN_REVERSION' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="bt-oversold" className="block text-[11px] font-medium text-muted-foreground mb-1">
                      RSI Oversold
                    </label>
                    <input
                      id="bt-oversold"
                      type="number"
                      min={15}
                      max={45}
                      value={rsiOversold}
                      onChange={(e) => setRsiOversold(Number(e.target.value) || 35)}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="bt-overbought" className="block text-[11px] font-medium text-muted-foreground mb-1">
                      RSI Overbought
                    </label>
                    <input
                      id="bt-overbought"
                      type="number"
                      min={55}
                      max={85}
                      value={rsiOverbought}
                      onChange={(e) => setRsiOverbought(Number(e.target.value) || 68)}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="bt-slip" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Slippage (bps)
                  </label>
                  <input
                    id="bt-slip"
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    value={slippageBps}
                    onChange={(e) => setSlippageBps(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="bt-comm" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Commission (bps)
                  </label>
                  <input
                    id="bt-comm"
                    type="number"
                    min={0}
                    max={50}
                    step={1}
                    value={commissionBps}
                    onChange={(e) => setCommissionBps(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                loading={loading}
                icon={<Play className="h-3.5 w-3.5" />}
              >
                Run Historical Backtest
              </Button>
            </form>

            {errorMsg && (
              <div className="rounded-md border border-loss/40 bg-loss-light p-2.5 text-xs text-loss">
                {errorMsg}
              </div>
            )}

            {result && (
              <div className="rounded-md border border-border bg-secondary/40 p-3 text-[11px] space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Equity:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(result.final_equity, activeCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buy &amp; Hold Bench:</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(result.benchmark_final_equity, activeCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fees + Slip:</span>
                  <span className="text-warning">
                    {formatCurrency(result.total_fees_paid + result.total_slippage_paid, activeCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Exposure:</span>
                  <span className="text-foreground">{result.exposure_pct}%</span>
                </div>
              </div>
            )}
          </Card>

          {/* Right Analytics Area */}
          <div className="lg:col-span-8 space-y-5">
            {result && (
              <>
                {/* Risk & Return KPI Strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard
                    title="Total Return"
                    value={result.metrics.total_return_pct}
                    suffix="%"
                    subtitle={`Alpha ${formatPercent(result.alpha_pct)}`}
                    changePct={result.metrics.total_return_pct}
                  />
                  <StatCard
                    title="Sharpe Ratio"
                    value={result.metrics.sharpe_ratio}
                    decimals={2}
                    subtitle={`Sortino ${result.metrics.sortino_ratio.toFixed(2)}`}
                  />
                  <StatCard
                    title="Max Drawdown"
                    value={result.metrics.max_drawdown_pct}
                    suffix="%"
                    subtitle={`${result.metrics.max_drawdown_duration_days}d duration`}
                  />
                  <StatCard
                    title="Annualized Vol"
                    value={result.metrics.annualized_volatility_pct}
                    suffix="%"
                    subtitle={`Win ${result.win_rate_pct}% (${result.total_trades})`}
                  />
                </div>

                {/* Visualization Card */}
                <Card>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">
                        {result.symbol} · {result.strategy.replaceAll('_', ' ')}
                        {result.data_source && (
                          <span className="ml-2 font-mono text-[10px] font-normal text-gain">
                            ({result.data_source.startsWith('YAHOO') ? 'Yahoo Finance Real' : result.data_source})
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        {result.date_range ? `${result.date_range} · ` : ''}Calmar {result.metrics.calmar_ratio} · Profit Factor {result.profit_factor} · 95% VaR {result.metrics.var_95_pct}% · CVaR {result.metrics.cvar_95_pct}%
                      </p>
                    </div>

                    <SegmentedControl
                      layoutId="backtest-chart-tab"
                      size="sm"
                      value={chartTab}
                      onChange={setChartTab}
                      options={[
                        { value: 'EQUITY', label: 'Equity Curve' },
                        { value: 'ROLLING', label: 'Rolling Sharpe/Vol' },
                        { value: 'DRAWDOWN', label: 'Drawdown' },
                        { value: 'TRADES', label: `Trades (${result.total_trades})` },
                      ]}
                    />
                  </div>

                  {chartTab === 'EQUITY' && (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.timeseries} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="btEquityGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={isDark ? '#71717a' : '#71717a'} minTickGap={30} />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            stroke={isDark ? '#71717a' : '#71717a'}
                            tickFormatter={(v) => formatCurrency(v, activeCurrency, true)}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            formatter={(val, name) => [
                              formatCurrency(Number(val), activeCurrency),
                              name === 'equity' ? 'Strategy Equity' : 'Buy & Hold',
                            ]}
                            contentStyle={{
                              backgroundColor: isDark ? '#111114' : '#ffffff',
                              borderColor: isDark ? '#27272a' : '#e4e4e7',
                              fontSize: '12px',
                              borderRadius: '6px',
                            }}
                          />
                          <Area type="monotone" dataKey="equity" stroke="#0ea5e9" strokeWidth={2} fill="url(#btEquityGrad)" />
                          <Area type="monotone" dataKey="benchmark" stroke={isDark ? '#71717a' : '#a1a1aa'} strokeDasharray="4 4" strokeWidth={1.5} fillOpacity={0} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {chartTab === 'ROLLING' && (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.timeseries} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" minTickGap={30} />
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
                          <Line yAxisId="vol" type="monotone" dataKey="rolling_volatility_pct" name="Rolling Ann. Vol %" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {chartTab === 'DRAWDOWN' && (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.timeseries} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#e4e4e7'} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#71717a" minTickGap={30} />
                          <YAxis tick={{ fontSize: 11 }} stroke="#71717a" tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            formatter={(val) => [`${Number(val).toFixed(2)}%`, 'Drawdown']}
                            contentStyle={{
                              backgroundColor: isDark ? '#111114' : '#ffffff',
                              borderColor: isDark ? '#27272a' : '#e4e4e7',
                              fontSize: '12px',
                              borderRadius: '6px',
                            }}
                          />
                          <Area type="monotone" dataKey="drawdown_pct" name="Strategy DD" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={1.75} />
                          <Area type="monotone" dataKey="benchmark_drawdown_pct" name="Benchmark DD" stroke="#71717a" fillOpacity={0} strokeDasharray="4 4" strokeWidth={1.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {chartTab === 'TRADES' && (
                    <DataTable
                      caption="Backtest historical round-trip trade executions"
                      columns={tradeColumns}
                      data={result.trades}
                      keyExtractor={(t, ) => `${t.entry_date}-${t.exit_date}-${t.entry_price}`}
                      compact
                      emptyMessage="No completed round-trip trades in this parameter window."
                    />
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {workspaceTab === 'LEADERBOARD' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-warning" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Multi-User Account Evaluation</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Live paper equity, P&amp;L, and best strategy Sharpe across isolated seats
                  </p>
                </div>
              </div>
              <Badge variant="brand">5 Isolated Ledgers</Badge>
            </div>

            <DataTable
              caption="Multi-user quantitative strategy and portfolio evaluation"
              data={leaderboard?.accounts ?? []}
              keyExtractor={(a) => a.user_id}
              columns={[
                {
                  key: 'name',
                  header: 'Researcher',
                  render: (a) => (
                    <div>
                      <span className="font-semibold text-foreground">{a.name}</span>
                      <span className="block text-[10px] text-muted-foreground">{a.role}</span>
                    </div>
                  ),
                },
                {
                  key: 'total_value',
                  header: 'Equity',
                  align: 'right',
                  sortable: true,
                  sortType: 'number',
                  sortValue: (a) => a.total_value,
                  render: (a) => <span className="font-mono font-medium">{formatCurrency(a.total_value, a.currency)}</span>,
                },
                {
                  key: 'total_pnl_pct',
                  header: 'Return',
                  align: 'right',
                  sortable: true,
                  sortType: 'number',
                  sortValue: (a) => a.total_pnl_pct,
                  render: (a) => (
                    <Badge variant={a.total_pnl_pct >= 0 ? 'gain' : 'loss'}>
                      {formatPercent(a.total_pnl_pct)}
                    </Badge>
                  ),
                },
                {
                  key: 'best_sharpe',
                  header: 'Best Sharpe',
                  align: 'right',
                  sortable: true,
                  sortType: 'number',
                  sortValue: (a) => a.best_sharpe,
                  render: (a) => <span className="font-mono font-semibold text-brand">{a.best_sharpe.toFixed(2)}</span>,
                },
                {
                  key: 'backtests_count',
                  header: 'Runs',
                  align: 'right',
                  render: (a) => <span className="font-mono text-muted-foreground">{a.backtests_count}</span>,
                },
              ]}
            />
          </Card>

          <Card className="lg:col-span-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent Strategy Evaluations</h2>
                <p className="text-[11px] text-muted-foreground">Persisted backtest runs across workspace</p>
              </div>
            </div>
            <AnimatedList
              items={(leaderboard?.recent_strategies ?? []).slice(0, 8)}
              keyExtractor={(s) => s.id}
              renderItem={(s) => (
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">{s.symbol}</span>
                      <Badge variant="neutral">{s.strategy.replaceAll('_', ' ')}</Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {s.user_name} · {s.total_trades} trades · DD {s.max_drawdown_pct}%
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className={`block font-semibold ${s.total_return_pct >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {formatPercent(s.total_return_pct)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">SR {s.sharpe_ratio.toFixed(2)}</span>
                  </div>
                </div>
              )}
            />
          </Card>
        </div>
      )}

      {workspaceTab === 'SCREENER' && (
        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by ticker, company, or sector..."
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                aria-label="Filter by exchange"
                className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Exchanges (NSE &amp; US)</option>
                <option value="NSE">NSE India</option>
                <option value="NASDAQ">NASDAQ</option>
                <option value="NYSE">NYSE Arca</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuotes.map((item) => (
              <div
                key={item.symbol}
                className="group flex flex-col justify-between rounded-md border border-border bg-background p-4 hover:border-brand/60 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate(`/chart-lab?symbol=${item.symbol}`)}
                      className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-foreground hover:text-brand cursor-pointer"
                    >
                      <span>{item.symbol}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-[11px] text-muted-foreground">{item.name}</p>
                  </div>
                  <Badge variant={item.changePct >= 0 ? 'gain' : 'loss'}>
                    {formatPercent(item.changePct)}
                  </Badge>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-lg font-semibold text-foreground">
                    {formatCurrency(item.lastPrice, item.currency)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{item.exchange}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                  <span>Vol {formatVolume(item.volume, item.currency === 'INR')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSymbol(item.symbol);
                      setWorkspaceTab('BACKTEST');
                    }}
                    className="font-mono text-[10px] font-semibold text-brand hover:underline cursor-pointer"
                  >
                    Backtest →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
