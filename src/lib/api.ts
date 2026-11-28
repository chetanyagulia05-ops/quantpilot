// ============================================================
// QuantPilot — Typed REST API Client
// Communicates with Node.js TypeScript API & Python Quant Engine
// using strict X-User-Id account isolation headers.
// ============================================================

import type { CandleData } from '@/types/chart';

export interface MarketQuote {
  symbol: string;
  yf_symbol?: string;
  name: string;
  exchange: string;
  sector: string;
  currency: 'INR' | 'USD';
  basePrice: number;
  lastPrice: number;
  bid: number;
  ask: number;
  prevClose: number;
  change: number;
  changePct: number;
  volatility: number;
  volume: number;
  lastTradeDate?: string;
  dataSource?: string;
  updatedAt: string;
}

export interface RiskMetricsSummary {
  total_return_pct: number;
  cagr_pct: number;
  annualized_volatility_pct: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  omega_ratio?: number;
  max_drawdown_pct: number;
  max_drawdown_duration_days: number;
  var_95_pct: number;
  cvar_95_pct: number;
  var_99_pct?: number;
  cvar_99_pct?: number;
  parametric_var_95_pct?: number;
  skewness?: number;
  excess_kurtosis?: number;
  beta?: number;
  jensens_alpha_pct?: number;
  tracking_error_pct?: number;
  information_ratio?: number;
  r_squared?: number;
  up_capture_pct?: number;
  down_capture_pct?: number;
}

export interface BacktestTimeseriesPoint {
  date: string;
  price: number;
  equity: number;
  benchmark: number;
  drawdown_pct: number;
  benchmark_drawdown_pct: number;
  rolling_sharpe: number;
  rolling_volatility_pct: number;
  signal: number;
}

export interface BacktestTradeRecord {
  entry_date: string;
  exit_date: string;
  side: string;
  quantity: number;
  entry_price: number;
  exit_price: number;
  fees: number;
  pnl: number;
  pnl_pct: number;
}

export interface BacktestResponse {
  symbol: string;
  yf_symbol?: string;
  data_source?: string;
  date_range?: string;
  currency: 'INR' | 'USD';
  strategy: string;
  lookback_days: number;
  initial_capital: number;
  final_equity: number;
  benchmark_final_equity: number;
  alpha_pct: number;
  exposure_pct: number;
  total_trades: number;
  win_rate_pct: number;
  profit_factor: number;
  total_fees_paid: number;
  total_slippage_paid: number;
  metrics: RiskMetricsSummary;
  benchmark_metrics: RiskMetricsSummary;
  timeseries: BacktestTimeseriesPoint[];
  trades: BacktestTradeRecord[];
  engine_mode?: string;
}

export interface FrontierPoint {
  vol_pct: number;
  ret_pct: number;
  sharpe: number;
  weights?: Record<string, number>;
}

export interface PortfolioRiskResponse {
  user_id: string;
  benchmark_symbol?: string;
  data_source?: string;
  date_range?: string;
  total_equity: number;
  invested_value: number;
  cash_weight_pct: number;
  diversification_ratio?: number;
  effective_num_bets?: number;
  metrics: RiskMetricsSummary;
  rolling_series: Array<{
    date: string;
    rolling_sharpe: number;
    rolling_volatility_pct: number;
    rolling_beta?: number;
    drawdown_pct: number;
    benchmark_drawdown_pct?: number;
    equity: number;
    benchmark?: number;
  }>;
  correlation_matrix: {
    symbols: string[];
    matrix: number[][];
  };
  risk_contributions: Array<{
    symbol: string;
    weight_pct: number;
    risk_contribution_pct: number;
    standalone_vol_pct: number;
    beta?: number;
  }>;
  stress_scenarios?: Array<{
    scenario: string;
    shock_assumption: string;
    estimated_impact_pct: number;
    estimated_pnl: number;
  }>;
  efficient_frontier?: {
    cloud: FrontierPoint[];
    current: FrontierPoint | null;
    max_sharpe: FrontierPoint | null;
    min_variance: FrontierPoint | null;
  };
  monte_carlo: Array<{
    day: number;
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  }>;
  engine_mode?: string;
}

export interface MultiUserLeaderboardResponse {
  accounts: Array<{
    user_id: string;
    name: string;
    role: string;
    currency: 'INR' | 'USD';
    total_value: number;
    cash_balance: number;
    total_pnl: number;
    total_pnl_pct: number;
    positions_count: number;
    trades_count: number;
    backtests_count: number;
    best_sharpe: number;
  }>;
  recent_strategies: Array<{
    id: string;
    user_id: string;
    user_name: string;
    symbol: string;
    strategy: string;
    total_return_pct: number;
    sharpe_ratio: number;
    max_drawdown_pct: number;
    annualized_volatility_pct: number;
    win_rate_pct: number;
    total_trades: number;
    created_at: string;
  }>;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { userId?: string } = {}
): Promise<T> {
  const { userId, headers, ...rest } = options;
  const res = await fetch(path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': userId } : {}),
      ...headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.detail || `HTTP ${res.status}`);
  }
  return data as T;
}

export const quantApi = {
  health: () =>
    apiRequest<{
      status: string;
      api: string;
      data_source?: string;
      python_quant_online: boolean;
      python_quant?: { numpy_version?: string; pandas_version?: string; yfinance_version?: string };
    }>('/api/health'),

  getQuotes: () =>
    apiRequest<{ data_source?: string; quotes: MarketQuote[]; timestamp: string }>('/api/market/quotes'),

  syncMarketData: (refresh = true) =>
    apiRequest<{
      success: boolean;
      data_source: string;
      synced_count: number;
      matchedCount: number;
      matchedEvents: Array<{ user_id: string; order_id: string; symbol: string; price: number }>;
      quotes: MarketQuote[];
    }>('/api/market/sync', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }),

  stepTick: (shock?: { symbol: string; priceChangePct: number }) =>
    apiRequest<{
      tick: number;
      updatedAt: string;
      matchedCount: number;
      matchedEvents: Array<{ user_id: string; order_id: string; symbol: string; price: number }>;
      quotes: MarketQuote[];
    }>('/api/market/tick', {
      method: 'POST',
      body: JSON.stringify(shock ?? {}),
    }),

  getOhlcv: (symbol: string, timeframe = '3M', days = 360, refresh = false) =>
    apiRequest<{
      symbol: string;
      yf_symbol?: string;
      timeframe?: string;
      data_source: string;
      candles: CandleData[];
    }>(
      `/api/quant/ohlcv/${encodeURIComponent(symbol)}?days=${days}&timeframe=${encodeURIComponent(timeframe)}&refresh=${refresh}`
    ),

  getMarketOverview: (refresh = false) =>
    apiRequest<{
      data_source: string;
      lastTradeDate?: string;
      indices: Array<{
        chartSymbol: string;
        symbol: string;
        name: string;
        value: number;
        change: number;
        change_pct: number;
        region: 'India' | 'US';
        lastTradeDate?: string;
      }>;
      sectors: Array<{ name: string; change_pct: number; symbol?: string }>;
    }>(`/api/market/overview?refresh=${refresh}`),

  getNews: (refresh = false) =>
    apiRequest<{
      data_source: string;
      articles: Array<{
        id: string;
        title: string;
        summary: string;
        source: string;
        published_at: string;
        url: string;
        category: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        related_symbols: string[];
      }>;
    }>(`/api/market/news?refresh=${refresh}`),

  getPortfolio: (userId: string) => apiRequest<any>('/api/portfolio', { userId }),

  resetPortfolio: (userId: string) =>
    apiRequest<any>('/api/portfolio/reset', { method: 'POST', userId }),

  placeOrder: (
    userId: string,
    payload: {
      symbol: string;
      side: 'BUY' | 'SELL';
      order_type: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
      quantity: number;
      limit_price?: number;
      stop_price?: number;
    }
  ) =>
    apiRequest<{ success: boolean; message: string; state?: any }>('/api/orders', {
      method: 'POST',
      userId,
      body: JSON.stringify(payload),
    }),

  cancelOrder: (userId: string, orderId: string) =>
    apiRequest<{ success: boolean; message: string; state?: any }>(`/api/orders/${orderId}`, {
      method: 'DELETE',
      userId,
    }),

  markNotificationsRead: (userId: string) =>
    apiRequest<{ notifications: any[] }>('/api/portfolio/notifications/read', {
      method: 'POST',
      userId,
    }),

  runBacktest: (
    userId: string,
    payload: {
      symbol: string;
      strategy: string;
      lookback_days: number;
      initial_capital: number;
      position_size_pct: number;
      slippage_bps: number;
      commission_bps: number;
      risk_free_rate: number;
      params: Record<string, number>;
    }
  ) =>
    apiRequest<BacktestResponse>('/api/quant/backtest', {
      method: 'POST',
      userId,
      body: JSON.stringify(payload),
    }),

  getPortfolioRisk: (userId: string, horizonDays = 60) =>
    apiRequest<PortfolioRiskResponse>('/api/quant/portfolio-risk', {
      method: 'POST',
      userId,
      body: JSON.stringify({ horizon_days: horizonDays, num_simulations: 200 }),
    }),

  getLeaderboard: () => apiRequest<MultiUserLeaderboardResponse>('/api/quant/leaderboard'),
};
