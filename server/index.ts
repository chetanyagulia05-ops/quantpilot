// ============================================================
// QuantPilot — Node.js + TypeScript REST API Gateway
// Coordinates multi-user paper trading, deterministic order
// matching, live Yahoo Finance sync, and Python Quant Engine.
// ============================================================

import express from 'express';
import cors from 'cors';
import { TradingEngine, USERS, type MarketQuote } from './engine';
import {
  generateHistoricalCandles,
  runFallbackBacktest,
  runFallbackPortfolioRisk,
} from './quantFallback';

const PORT = Number(process.env.API_PORT || 4000);
const PYTHON_QUANT_URL = process.env.QUANT_ENGINE_URL || 'http://127.0.0.1:8001';

const app = express();
const engine = new TradingEngine();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function resolveUserId(req: express.Request): string {
  const headerId = req.header('x-user-id');
  if (headerId && USERS.some((u) => u.id === headerId)) {
    return headerId;
  }
  return USERS[0].id;
}

async function checkPythonHealth(): Promise<{ online: boolean; details?: Record<string, unknown> }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${PYTHON_QUANT_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const details = (await res.json()) as Record<string, unknown>;
      return { online: true, details };
    }
  } catch {
    // python service offline
  }
  return { online: false };
}

async function syncRealQuotesFromPython(forceRefresh = false) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${PYTHON_QUANT_URL}/api/quant/quotes?refresh=${forceRefresh ? 'true' : 'false'}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { data_source: string; quotes: MarketQuote[] };
    if (data?.quotes?.length) {
      return engine.syncQuotesFromRealFeed(data.quotes, data.data_source);
    }
  } catch {
    // python offline or timeout
  }
  return null;
}

app.get('/api/health', async (_req, res) => {
  const py = await checkPythonHealth();
  res.json({
    status: 'ok',
    api: 'node-typescript-express',
    data_source: engine.getDataSource(),
    python_quant_online: py.online,
    python_quant: py.details ?? null,
    timestamp: new Date().toISOString(),
  });
});

// ── Market Quotes, Real Yahoo Finance Sync & Tick Simulation ──

app.get('/api/market/quotes', async (_req, res) => {
  if (engine.getDataSource() === 'INITIAL_SNAPSHOT') {
    await syncRealQuotesFromPython(false);
  }
  res.json({
    data_source: engine.getDataSource(),
    quotes: engine.getQuotes(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/market/sync', async (req, res) => {
  const forceRefresh = Boolean(req.body?.refresh ?? true);
  const synced = await syncRealQuotesFromPython(forceRefresh);
  if (!synced) {
    res.status(503).json({
      success: false,
      message: 'Python quant service unreachable for live Yahoo Finance sync.',
      data_source: engine.getDataSource(),
      quotes: engine.getQuotes(),
    });
    return;
  }
  res.json({
    success: true,
    ...synced,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/market/tick', (req, res) => {
  const { symbol, priceChangePct } = req.body ?? {};
  const shock =
    symbol && typeof priceChangePct === 'number'
      ? { symbol: String(symbol), priceChangePct: Number(priceChangePct) }
      : undefined;
  const result = engine.stepMarketTick(shock);
  res.json(result);
});

// ── Multi-User Portfolio & Order Execution API ───────────────

app.get('/api/portfolio', async (req, res) => {
  if (engine.getDataSource() === 'INITIAL_SNAPSHOT') {
    await syncRealQuotesFromPython(false);
  }
  const userId = resolveUserId(req);
  res.json({
    ...engine.getReconciledPortfolio(userId),
    data_source: engine.getDataSource(),
  });
});

app.post('/api/portfolio/reset', (req, res) => {
  const userId = resolveUserId(req);
  res.json({
    ...engine.resetUserPortfolio(userId),
    data_source: engine.getDataSource(),
  });
});

app.post('/api/portfolio/notifications/read', (req, res) => {
  const userId = resolveUserId(req);
  res.json({ notifications: engine.markNotificationsRead(userId) });
});

app.post('/api/orders', (req, res) => {
  const userId = resolveUserId(req);
  const { symbol, side, order_type, quantity, limit_price, stop_price } = req.body ?? {};

  if (!symbol || !side || !order_type || !quantity) {
    res.status(400).json({ success: false, message: 'Missing required order fields.' });
    return;
  }

  const result = engine.placeOrder(userId, {
    symbol: String(symbol),
    side,
    order_type,
    quantity: Number(quantity),
    limit_price: limit_price !== undefined ? Number(limit_price) : undefined,
    stop_price: stop_price !== undefined ? Number(stop_price) : undefined,
  });

  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json({
    ...result,
    state: engine.getReconciledPortfolio(userId),
  });
});

app.delete('/api/orders/:orderId', (req, res) => {
  const userId = resolveUserId(req);
  const result = engine.cancelOrder(userId, req.params.orderId);
  if (!result.success) {
    res.status(404).json(result);
    return;
  }
  res.json({
    ...result,
    state: engine.getReconciledPortfolio(userId),
  });
});

// ── Quantitative OHLCV, Backtesting & Portfolio Risk ─────────

app.get('/api/market/overview', async (req, res) => {
  const refresh = req.query.refresh === 'true';
  try {
    const pyRes = await fetch(`${PYTHON_QUANT_URL}/api/quant/market-overview?refresh=${refresh}`);
    if (pyRes.ok) {
      res.json(await pyRes.json());
      return;
    }
  } catch {
    // fallback below
  }
  const quotes = engine.getQuotes();
  const findQ = (sym: string, fallbackVal: number) => {
    const q = quotes.find((item) => item.symbol === sym);
    return {
      chartSymbol: sym,
      symbol: sym === 'NIFTY50' ? 'NIFTY 50' : sym === 'BANKNIFTY' ? 'BANK NIFTY' : sym === 'SPX' ? 'S&P 500' : sym === 'NDX' ? 'NASDAQ 100' : sym,
      name: q?.name ?? sym,
      value: q?.lastPrice ?? fallbackVal,
      change: q?.change ?? 0,
      change_pct: q?.changePct ?? 0,
      region: q?.currency === 'INR' ? 'India' : 'US',
      lastTradeDate: q?.lastTradeDate ?? '',
    };
  };
  res.json({
    data_source: engine.getDataSource(),
    indices: [
      findQ('NIFTY50', 25607.2),
      findQ('SENSEX', 83339.26),
      findQ('BANKNIFTY', 63040.9),
      findQ('SPX', 7297.49),
      findQ('NDX', 26726.39),
    ],
    sectors: [],
  });
});

app.get('/api/market/news', async (req, res) => {
  const refresh = req.query.refresh === 'true';
  try {
    const pyRes = await fetch(`${PYTHON_QUANT_URL}/api/quant/news?refresh=${refresh}`);
    if (pyRes.ok) {
      res.json(await pyRes.json());
      return;
    }
  } catch {
    // fallback
  }
  res.json({ data_source: 'OFFLINE', articles: [] });
});

app.get('/api/quant/ohlcv/:symbol', async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  const days = Number(req.query.days ?? 260);
  const timeframe = String(req.query.timeframe ?? '3M').toUpperCase();
  const refresh = req.query.refresh === 'true';

  try {
    const pyRes = await fetch(
      `${PYTHON_QUANT_URL}/api/quant/ohlcv/${encodeURIComponent(sym)}?days=${days}&timeframe=${encodeURIComponent(timeframe)}&refresh=${refresh}`
    );
    if (pyRes.ok) {
      const data = await pyRes.json();
      res.json(data);
      return;
    }
  } catch {
    // fallback
  }

  const candles = generateHistoricalCandles(sym, days);
  res.json({
    symbol: sym,
    timeframe,
    data_source: 'TS_FALLBACK',
    candles,
  });
});

app.post('/api/quant/backtest', async (req, res) => {
  const userId = resolveUserId(req);
  const userMeta = USERS.find((u) => u.id === userId) ?? USERS[0];
  const payload = req.body ?? {};

  try {
    const pyRes = await fetch(`${PYTHON_QUANT_URL}/api/quant/backtest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (pyRes.ok) {
      const data = await pyRes.json();
      engine.recordBacktestRun({
        user_id: userId,
        user_name: userMeta.name,
        symbol: data.symbol,
        strategy: data.strategy,
        total_return_pct: data.metrics.total_return_pct,
        sharpe_ratio: data.metrics.sharpe_ratio,
        max_drawdown_pct: data.metrics.max_drawdown_pct,
        annualized_volatility_pct: data.metrics.annualized_volatility_pct,
        win_rate_pct: data.win_rate_pct,
        total_trades: data.total_trades,
      });
      res.json({ ...data, engine_mode: 'python-numpy-pandas' });
      return;
    }
  } catch {
    // Fallback to TypeScript quant module
  }

  const fallback = runFallbackBacktest(payload);
  engine.recordBacktestRun({
    user_id: userId,
    user_name: userMeta.name,
    symbol: fallback.symbol,
    strategy: fallback.strategy,
    total_return_pct: fallback.metrics.total_return_pct,
    sharpe_ratio: fallback.metrics.sharpe_ratio,
    max_drawdown_pct: fallback.metrics.max_drawdown_pct,
    annualized_volatility_pct: fallback.metrics.annualized_volatility_pct,
    win_rate_pct: fallback.win_rate_pct,
    total_trades: fallback.total_trades,
  });
  res.json(fallback);
});

app.post('/api/quant/portfolio-risk', async (req, res) => {
  const userId = resolveUserId(req);
  const recon = engine.getReconciledPortfolio(userId);
  const riskFreeRate = Number(req.body?.risk_free_rate ?? (recon.currency === 'INR' ? 0.065 : 0.0425));

  try {
    const pyRes = await fetch(`${PYTHON_QUANT_URL}/api/quant/portfolio-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        currency: recon.currency,
        cash_balance: recon.portfolio.cash_balance,
        holdings: recon.holdings.map((h) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          current_price: h.current_price,
          avg_cost: h.avg_cost,
          sector: h.sector,
        })),
        risk_free_rate: riskFreeRate,
        horizon_days: Number(req.body?.horizon_days ?? 60),
        num_simulations: Number(req.body?.num_simulations ?? 200),
      }),
    });

    if (pyRes.ok) {
      const data = await pyRes.json();
      res.json({ ...data, engine_mode: 'python-numpy-pandas' });
      return;
    }
  } catch {
    // Fallback
  }

  res.json(runFallbackPortfolioRisk(userId, recon.portfolio.cash_balance, recon.holdings));
});

app.get('/api/quant/leaderboard', (_req, res) => {
  res.json(engine.getMultiUserLeaderboard());
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[QuantPilot API] Node.js TypeScript server listening on http://127.0.0.1:${PORT}`);
  // Sync real Yahoo Finance market quotes shortly after startup
  setTimeout(() => {
    syncRealQuotesFromPython(false).then((res) => {
      if (res) {
        console.log(`[QuantPilot API] Synced ${res.synced_count} live quotes (${res.data_source})`);
      }
    });
  }, 1500);
});
