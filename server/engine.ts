// ============================================================
// QuantPilot — Deterministic Order Matching & Ledger Engine
// Coordinates multi-user account isolation, simulated bid/ask
// spreads, slippage, fees, and limit/stop order matching.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

export interface MarketQuote {
  symbol: string;
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

export interface ServerHolding {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  allocation_pct: number;
  sector: string;
}

export interface ServerOrder {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  quantity: number;
  price: number;
  limit_price?: number;
  stop_price?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  filled_at?: string;
  filled_price?: number;
  slippage_cost?: number;
  created_at: string;
  fees: number;
}

export interface ServerTrade {
  id: string;
  user_id: string;
  order_id: string;
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  fees: number;
  slippage: number;
  pnl?: number;
  pnl_pct?: number;
  executed_at: string;
}

export interface SavedBacktestSummary {
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
}

export interface ExecutionEvent {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'trade' | 'alert' | 'system';
  read: boolean;
  timestamp: string;
}

export interface UserLedger {
  user_id: string;
  cash: number;
  realizedPnl: number;
  holdings: ServerHolding[];
  orders: ServerOrder[];
  trades: ServerTrade[];
  notifications: ExecutionEvent[];
}

interface StoreData {
  schemaVersion?: number;
  dataSource?: string;
  quotes: Record<string, MarketQuote>;
  tickCount: number;
  ledgers: Record<string, UserLedger>;
  strategies: SavedBacktestSummary[];
}

export const INITIAL_TICKERS: Array<{
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  basePrice: number;
  volatility: number;
  currency: 'INR' | 'USD';
}> = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy & Digital', basePrice: 1382.6, volatility: 0.016, currency: 'INR' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services', basePrice: 2572.5, volatility: 0.014, currency: 'INR' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', sector: 'Financial Services', basePrice: 857.25, volatility: 0.015, currency: 'INR' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', sector: 'IT Services', basePrice: 1151.3, volatility: 0.017, currency: 'INR' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Passenger Vehicles', exchange: 'NSE', sector: 'Automotive', basePrice: 258.0, volatility: 0.024, currency: 'INR' },
  { symbol: 'NIFTY50', name: 'NIFTY 50 Index', exchange: 'NSE Benchmark', sector: 'Indian Broad Market', basePrice: 25607.2, volatility: 0.011, currency: 'INR' },
  { symbol: 'SENSEX', name: 'BSE SENSEX Index', exchange: 'BSE Benchmark', sector: 'Indian Broad Market', basePrice: 83339.26, volatility: 0.011, currency: 'INR' },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', exchange: 'NSE Sector', sector: 'Indian Banking', basePrice: 63040.9, volatility: 0.014, currency: 'INR' },
  { symbol: 'SPX', name: 'S&P 500 Index', exchange: 'US Benchmark', sector: 'US Broad Market', basePrice: 7297.49, volatility: 0.011, currency: 'USD' },
  { symbol: 'NDX', name: 'NASDAQ 100 Index', exchange: 'US Tech Index', sector: 'US Technology', basePrice: 26726.39, volatility: 0.015, currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Semiconductors', basePrice: 150.49, volatility: 0.028, currency: 'USD' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Consumer Electronics', basePrice: 358.54, volatility: 0.015, currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Enterprise Software', basePrice: 492.85, volatility: 0.016, currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Automotive / EV', basePrice: 400.0, volatility: 0.034, currency: 'USD' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE Arca', sector: 'US Broad Market', basePrice: 728.32, volatility: 0.011, currency: 'USD' },
];

export const USERS = [
  { id: 'demo-user-001', name: 'Alice Sharma', role: 'Senior Quant Trader', currency: 'INR' as const },
  { id: 'demo-user-002', name: 'Bob Verma', role: 'Derivatives Specialist', currency: 'INR' as const },
  { id: 'demo-user-003', name: 'Charlie Mehta', role: 'Macro & Geopolitical Analyst', currency: 'INR' as const },
  { id: 'demo-user-004', name: 'Diana Patel', role: 'Risk Manager', currency: 'INR' as const },
  { id: 'demo-user-005', name: 'Evan Roy', role: 'Portfolio Manager', currency: 'USD' as const },
];

const DEFAULT_CASH = 500000;

function makeSpread(price: number): { bid: number; ask: number } {
  const halfSpread = Math.max(0.05, Number((price * 0.0003).toFixed(2)));
  return {
    bid: Number((price - halfSpread).toFixed(2)),
    ask: Number((price + halfSpread).toFixed(2)),
  };
}

function buildInitialQuotes(): Record<string, MarketQuote> {
  const quotes: Record<string, MarketQuote> = {};
  const now = new Date().toISOString();
  for (const t of INITIAL_TICKERS) {
    const { bid, ask } = makeSpread(t.basePrice);
    const prevClose = Number((t.basePrice * 0.992).toFixed(2));
    const change = Number((t.basePrice - prevClose).toFixed(2));
    const changePct = Number(((change / prevClose) * 100).toFixed(2));
    quotes[t.symbol] = {
      symbol: t.symbol,
      name: t.name,
      exchange: t.exchange,
      sector: t.sector,
      currency: t.currency,
      basePrice: t.basePrice,
      lastPrice: t.basePrice,
      bid,
      ask,
      prevClose,
      change,
      changePct,
      volatility: t.volatility,
      volume: Math.round(t.basePrice * 4500),
      updatedAt: now,
    };
  }
  return quotes;
}

function getSeedHoldingsForUser(userId: string, quotes: Record<string, MarketQuote>): ServerHolding[] {
  // Differentiate allocations per user slightly so multi-user evaluation & risk profiles look realistic
  const multiplier =
    userId === 'demo-user-001' ? 1.0 :
    userId === 'demo-user-002' ? 1.2 :
    userId === 'demo-user-003' ? 0.8 :
    userId === 'demo-user-004' ? 0.9 : 1.1;

  if (userId === 'demo-user-005') {
    const specs = [
      { symbol: 'NVDA', qty: 65, costDiscount: 0.89 },
      { symbol: 'AAPL', qty: 40, costDiscount: 0.94 },
      { symbol: 'MSFT', qty: 35, costDiscount: 0.93 },
      { symbol: 'SPY', qty: 45, costDiscount: 0.95 },
      { symbol: 'TSLA', qty: 25, costDiscount: 1.04 },
    ];
    return specs.map((s) => {
      const q = quotes[s.symbol];
      const cp = q.lastPrice;
      const avg = Number((cp * s.costDiscount).toFixed(2));
      const mv = Number((s.qty * cp).toFixed(2));
      const upnl = Number(((cp - avg) * s.qty).toFixed(2));
      return {
        id: `h-${s.symbol.toLowerCase()}-${userId}`,
        user_id: userId,
        portfolio_id: `port-${userId}`,
        symbol: s.symbol,
        name: q.name,
        quantity: s.qty,
        avg_cost: avg,
        current_price: cp,
        market_value: mv,
        unrealized_pnl: upnl,
        unrealized_pnl_pct: Number(((upnl / (avg * s.qty)) * 100).toFixed(2)),
        allocation_pct: 0,
        sector: q.sector,
      };
    });
  }

  const specs = [
    { symbol: 'RELIANCE', qty: Math.round(110 * multiplier), costDiscount: 0.94 },
    { symbol: 'TCS', qty: Math.round(55 * multiplier), costDiscount: 0.95 },
    { symbol: 'INFY', qty: Math.round(90 * multiplier), costDiscount: 0.93 },
    { symbol: 'HDFCBANK', qty: Math.round(140 * multiplier), costDiscount: 1.02 },
    { symbol: 'TATAMOTORS', qty: Math.round(280 * multiplier), costDiscount: 0.91 },
  ];

  return specs.map((s) => {
    const q = quotes[s.symbol];
    const cp = q.lastPrice;
    const avg = Number((cp * s.costDiscount).toFixed(2));
    const mv = Number((s.qty * cp).toFixed(2));
    const upnl = Number(((cp - avg) * s.qty).toFixed(2));
    return {
      id: `h-${s.symbol.toLowerCase()}-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: s.symbol,
      name: q.name,
      quantity: s.qty,
      avg_cost: avg,
      current_price: cp,
      market_value: mv,
      unrealized_pnl: upnl,
      unrealized_pnl_pct: Number(((upnl / (avg * s.qty)) * 100).toFixed(2)),
      allocation_pct: 0,
      sector: q.sector,
    };
  });
}

function buildSeedLedger(userId: string, quotes: Record<string, MarketQuote>): UserLedger {
  const cash = userId === 'demo-user-005' ? 45000 : DEFAULT_CASH;
  return {
    user_id: userId,
    cash,
    realizedPnl: 0,
    holdings: getSeedHoldingsForUser(userId, quotes),
    orders: [],
    trades: [],
    notifications: [
      {
        id: `evt-init-${userId}`,
        user_id: userId,
        title: 'Deterministic Ledger Synchronized',
        message: 'Multi-user paper ledger and order matching queue initialized.',
        type: 'system',
        read: false,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildSeedStrategies(): SavedBacktestSummary[] {
  return [
    {
      id: 'strat-seed-1',
      user_id: 'demo-user-001',
      user_name: 'Alice Sharma',
      symbol: 'RELIANCE',
      strategy: 'EMA_MOMENTUM',
      total_return_pct: 18.4,
      sharpe_ratio: 1.62,
      max_drawdown_pct: -6.8,
      annualized_volatility_pct: 14.2,
      win_rate_pct: 61.5,
      total_trades: 13,
      created_at: new Date(Date.now() - 3600_000 * 5).toISOString(),
    },
    {
      id: 'strat-seed-2',
      user_id: 'demo-user-002',
      user_name: 'Bob Verma',
      symbol: 'TATAMOTORS',
      strategy: 'MACD_TREND',
      total_return_pct: 22.1,
      sharpe_ratio: 1.48,
      max_drawdown_pct: -10.4,
      annualized_volatility_pct: 19.6,
      win_rate_pct: 56.0,
      total_trades: 16,
      created_at: new Date(Date.now() - 3600_000 * 4).toISOString(),
    },
    {
      id: 'strat-seed-3',
      user_id: 'demo-user-004',
      user_name: 'Diana Patel',
      symbol: 'TCS',
      strategy: 'RSI_MEAN_REVERSION',
      total_return_pct: 12.9,
      sharpe_ratio: 1.79,
      max_drawdown_pct: -4.3,
      annualized_volatility_pct: 9.8,
      win_rate_pct: 71.4,
      total_trades: 7,
      created_at: new Date(Date.now() - 3600_000 * 2).toISOString(),
    },
    {
      id: 'strat-seed-4',
      user_id: 'demo-user-005',
      user_name: 'Evan Roy',
      symbol: 'NVDA',
      strategy: 'SMA_CROSSOVER',
      total_return_pct: 29.7,
      sharpe_ratio: 1.84,
      max_drawdown_pct: -11.2,
      annualized_volatility_pct: 22.1,
      win_rate_pct: 60.0,
      total_trades: 10,
      created_at: new Date(Date.now() - 3600_000 * 1).toISOString(),
    },
  ];
}

export class TradingEngine {
  private store: StoreData;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): StoreData {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as StoreData;
        if (parsed && parsed.schemaVersion === 2 && parsed.quotes && parsed.ledgers) {
          return parsed;
        }
      }
    } catch {
      // regenerate clean store
    }

    const quotes = buildInitialQuotes();
    const ledgers: Record<string, UserLedger> = {};
    for (const u of USERS) {
      ledgers[u.id] = buildSeedLedger(u.id, quotes);
    }

    const initial: StoreData = {
      schemaVersion: 2,
      dataSource: 'INITIAL_SNAPSHOT',
      quotes,
      tickCount: 0,
      ledgers,
      strategies: buildSeedStrategies(),
    };
    this.saveStore(initial);
    return initial;
  }

  public getDataSource(): string {
    return this.store.dataSource ?? 'INITIAL_SNAPSHOT';
  }

  private saveStore(data: StoreData = this.store): void {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getQuotes(): MarketQuote[] {
    return Object.values(this.store.quotes);
  }

  public getQuote(symbol: string): MarketQuote | undefined {
    return this.store.quotes[symbol.toUpperCase()];
  }

  private ensureLedger(userId: string): UserLedger {
    if (!this.store.ledgers[userId]) {
      this.store.ledgers[userId] = buildSeedLedger(userId, this.store.quotes);
      this.saveStore();
    }
    return this.store.ledgers[userId];
  }

  public getReconciledPortfolio(userId: string) {
    const ledger = this.ensureLedger(userId);
    const userMeta = USERS.find((u) => u.id === userId) ?? USERS[0];
    // Mark holdings to latest market quote
    let holdingsVal = 0;
    let totalInvested = 0;
    for (const h of ledger.holdings) {
      const q = this.store.quotes[h.symbol];
      if (q) {
        h.current_price = q.lastPrice;
      }
      holdingsVal += h.quantity * h.current_price;
      totalInvested += h.quantity * h.avg_cost;
    }

    const totalEquity = ledger.cash + holdingsVal;
    const unrealizedPnl = holdingsVal - totalInvested;
    const totalPnl = ledger.realizedPnl + unrealizedPnl;
    const base = totalInvested > 0 ? totalInvested : (userMeta.currency === 'USD' ? 45000 : DEFAULT_CASH);
    const totalPnlPct = (totalPnl / base) * 100;

    const normalizedHoldings: ServerHolding[] = ledger.holdings.map((h) => {
      const mVal = Number((h.quantity * h.current_price).toFixed(2));
      const uPnl = Number(((h.current_price - h.avg_cost) * h.quantity).toFixed(2));
      const uPnlPct = h.avg_cost > 0 ? Number(((uPnl / (h.avg_cost * h.quantity)) * 100).toFixed(2)) : 0;
      const alloc = totalEquity > 0 ? Number(((mVal / totalEquity) * 100).toFixed(1)) : 0;
      return {
        ...h,
        market_value: mVal,
        unrealized_pnl: uPnl,
        unrealized_pnl_pct: uPnlPct,
        allocation_pct: alloc,
      };
    });

    return {
      portfolio: {
        id: `port-${userId}`,
        user_id: userId,
        name: `${userMeta.name}'s Portfolio`,
        cash_balance: Number(ledger.cash.toFixed(2)),
        total_value: Number(totalEquity.toFixed(2)),
        total_invested: Number(totalInvested.toFixed(2)),
        total_pnl: Number(totalPnl.toFixed(2)),
        total_pnl_pct: Number(totalPnlPct.toFixed(2)),
        realized_pnl: Number(ledger.realizedPnl.toFixed(2)),
        created_at: '2025-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      holdings: normalizedHoldings,
      orders: ledger.orders,
      trades: ledger.trades,
      notifications: ledger.notifications,
      currency: userMeta.currency,
    };
  }

  private executeFill(
    ledger: UserLedger,
    order: ServerOrder,
    rawMarketPrice: number
  ): { ok: boolean; message: string; trade?: ServerTrade } {
    const quote = this.store.quotes[order.symbol];
    const currency = quote?.currency ?? 'INR';
    const slippageBps = order.order_type === 'MARKET' ? 0.0005 : 0.0002; // 5 bps market, 2 bps limit/stop
    const execPrice = Number(
      (order.side === 'BUY'
        ? rawMarketPrice * (1 + slippageBps)
        : rawMarketPrice * (1 - slippageBps)
      ).toFixed(2)
    );
    const fee = currency === 'INR' ? 20.0 : 1.99;
    const notional = Number((order.quantity * execPrice).toFixed(2));
    const slippageCost = Number((Math.abs(execPrice - rawMarketPrice) * order.quantity).toFixed(2));

    if (order.side === 'BUY') {
      const totalRequired = notional + fee;
      if (ledger.cash < totalRequired) {
        order.status = 'REJECTED';
        return {
          ok: false,
          message: `Rejected BUY ${order.symbol}: insufficient cash (${totalRequired.toFixed(2)} required, ${ledger.cash.toFixed(2)} available).`,
        };
      }

      ledger.cash = Number((ledger.cash - totalRequired).toFixed(2));
      const idx = ledger.holdings.findIndex((h) => h.symbol === order.symbol);
      if (idx >= 0) {
        const cur = ledger.holdings[idx];
        const newQty = cur.quantity + order.quantity;
        const newAvg = (cur.quantity * cur.avg_cost + notional) / newQty;
        ledger.holdings[idx] = {
          ...cur,
          quantity: newQty,
          avg_cost: Number(newAvg.toFixed(2)),
          current_price: rawMarketPrice,
        };
      } else {
        ledger.holdings.push({
          id: `h-${order.symbol.toLowerCase()}-${ledger.user_id}`,
          user_id: ledger.user_id,
          portfolio_id: `port-${ledger.user_id}`,
          symbol: order.symbol,
          name: order.name,
          quantity: order.quantity,
          avg_cost: execPrice,
          current_price: rawMarketPrice,
          market_value: notional,
          unrealized_pnl: 0,
          unrealized_pnl_pct: 0,
          allocation_pct: 0,
          sector: quote?.sector ?? 'Equities',
        });
      }

      const trade: ServerTrade = {
        id: `trd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: ledger.user_id,
        order_id: order.id,
        symbol: order.symbol,
        name: order.name,
        side: 'BUY',
        quantity: order.quantity,
        price: execPrice,
        total: notional,
        fees: fee,
        slippage: slippageCost,
        executed_at: new Date().toISOString(),
      };
      ledger.trades.unshift(trade);
      order.status = 'FILLED';
      order.filled_at = trade.executed_at;
      order.filled_price = execPrice;
      order.slippage_cost = slippageCost;
      order.fees = fee;

      ledger.notifications.unshift({
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: ledger.user_id,
        title: `${order.order_type} BUY Filled: ${order.symbol}`,
        message: `Bought ${order.quantity} ${order.symbol} @ ${execPrice.toFixed(2)} (slippage ${slippageCost.toFixed(2)}, fee ${fee.toFixed(2)}).`,
        type: 'trade',
        read: false,
        timestamp: trade.executed_at,
      });

      return { ok: true, message: `Filled BUY ${order.quantity} ${order.symbol} @ ${execPrice.toFixed(2)}`, trade };
    } else {
      const existing = ledger.holdings.find((h) => h.symbol === order.symbol);
      if (!existing || existing.quantity < order.quantity) {
        order.status = 'REJECTED';
        return {
          ok: false,
          message: `Rejected SELL ${order.symbol}: insufficient shares (${existing?.quantity ?? 0} owned).`,
        };
      }

      const realized = Number(((execPrice - existing.avg_cost) * order.quantity - fee).toFixed(2));
      const proceeds = Number((notional - fee).toFixed(2));
      const pnlPct = Number((((execPrice - existing.avg_cost) / existing.avg_cost) * 100).toFixed(2));

      ledger.cash = Number((ledger.cash + proceeds).toFixed(2));
      ledger.realizedPnl = Number((ledger.realizedPnl + realized).toFixed(2));

      if (existing.quantity === order.quantity) {
        ledger.holdings = ledger.holdings.filter((h) => h.symbol !== order.symbol);
      } else {
        existing.quantity -= order.quantity;
        existing.current_price = rawMarketPrice;
      }

      const trade: ServerTrade = {
        id: `trd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: ledger.user_id,
        order_id: order.id,
        symbol: order.symbol,
        name: order.name,
        side: 'SELL',
        quantity: order.quantity,
        price: execPrice,
        total: notional,
        fees: fee,
        slippage: slippageCost,
        pnl: realized,
        pnl_pct: pnlPct,
        executed_at: new Date().toISOString(),
      };
      ledger.trades.unshift(trade);
      order.status = 'FILLED';
      order.filled_at = trade.executed_at;
      order.filled_price = execPrice;
      order.slippage_cost = slippageCost;
      order.fees = fee;

      ledger.notifications.unshift({
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: ledger.user_id,
        title: `${order.order_type} SELL Filled: ${order.symbol}`,
        message: `Sold ${order.quantity} ${order.symbol} @ ${execPrice.toFixed(2)} · Realized P&L ${realized >= 0 ? '+' : ''}${realized.toFixed(2)}.`,
        type: 'trade',
        read: false,
        timestamp: trade.executed_at,
      });

      return { ok: true, message: `Filled SELL ${order.quantity} ${order.symbol} @ ${execPrice.toFixed(2)}`, trade };
    }
  }

  public placeOrder(
    userId: string,
    input: {
      symbol: string;
      side: 'BUY' | 'SELL';
      order_type: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
      quantity: number;
      limit_price?: number;
      stop_price?: number;
    }
  ) {
    const ledger = this.ensureLedger(userId);
    const sym = input.symbol.toUpperCase();
    const quote = this.store.quotes[sym];
    if (!quote) {
      return { success: false, message: `Unknown symbol: ${input.symbol}` };
    }

    const qty = Math.floor(Number(input.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      return { success: false, message: 'Order quantity must be a positive integer.' };
    }

    const refPrice = input.side === 'BUY' ? quote.ask : quote.bid;
    const fee = quote.currency === 'INR' ? 20.0 : 1.99;

    // Pre-flight validation
    if (input.side === 'BUY') {
      const checkPrice = input.order_type === 'LIMIT' ? (input.limit_price ?? refPrice) : refPrice;
      const reqCash = qty * checkPrice * 1.001 + fee;
      if (ledger.cash < reqCash) {
        return {
          success: false,
          message: `Insufficient buying power. Estimated ${reqCash.toFixed(2)} required, ${ledger.cash.toFixed(2)} available.`,
        };
      }
    } else {
      const existing = ledger.holdings.find((h) => h.symbol === sym);
      if (!existing || existing.quantity < qty) {
        return {
          success: false,
          message: `Insufficient position. You hold ${existing?.quantity ?? 0} shares of ${sym}.`,
        };
      }
    }

    const now = new Date().toISOString();
    const order: ServerOrder = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: sym,
      name: quote.name,
      side: input.side,
      order_type: input.order_type,
      quantity: qty,
      price: refPrice,
      limit_price: input.limit_price,
      stop_price: input.stop_price,
      status: 'PENDING',
      created_at: now,
      fees: fee,
    };

    // Immediate match check for MARKET or marketable LIMIT/STOP
    const isMarketableLimit =
      order.order_type === 'LIMIT' &&
      order.limit_price !== undefined &&
      ((order.side === 'BUY' && quote.ask <= order.limit_price) ||
        (order.side === 'SELL' && quote.bid >= order.limit_price));

    const isTriggeredStop =
      order.order_type === 'STOP_LOSS' &&
      order.stop_price !== undefined &&
      ((order.side === 'SELL' && quote.lastPrice <= order.stop_price) ||
        (order.side === 'BUY' && quote.lastPrice >= order.stop_price));

    if (order.order_type === 'MARKET' || isMarketableLimit || isTriggeredStop) {
      ledger.orders.unshift(order);
      const fillResult = this.executeFill(ledger, order, refPrice);
      this.saveStore();
      return {
        success: fillResult.ok,
        message: fillResult.message,
        order,
        trade: fillResult.trade,
      };
    }

    ledger.orders.unshift(order);
    this.saveStore();
    return {
      success: true,
      message: `Queued ${order.order_type} ${order.side} ${qty} ${sym} @ ${
        order.limit_price ?? order.stop_price ?? refPrice
      }. Matching engine active.`,
      order,
    };
  }

  public cancelOrder(userId: string, orderId: string) {
    const ledger = this.ensureLedger(userId);
    const ord = ledger.orders.find((o) => o.id === orderId);
    if (!ord) return { success: false, message: 'Order not found.' };
    if (ord.status !== 'PENDING') {
      return { success: false, message: `Order is already ${ord.status}.` };
    }
    ord.status = 'CANCELLED';
    this.saveStore();
    return { success: true, message: `Cancelled order ${orderId}.` };
  }

  public resetUserPortfolio(userId: string) {
    this.store.ledgers[userId] = buildSeedLedger(userId, this.store.quotes);
    this.saveStore();
    return this.getReconciledPortfolio(userId);
  }

  private matchPendingOrders(): Array<{ user_id: string; order_id: string; symbol: string; price: number }> {
    const matchedEvents: Array<{ user_id: string; order_id: string; symbol: string; price: number }> = [];
    for (const userId of Object.keys(this.store.ledgers)) {
      const ledger = this.store.ledgers[userId];
      for (const ord of ledger.orders) {
        if (ord.status !== 'PENDING') continue;
        const q = this.store.quotes[ord.symbol];
        if (!q) continue;

        let shouldFill = false;
        let fillRef = ord.side === 'BUY' ? q.ask : q.bid;

        if (ord.order_type === 'LIMIT' && ord.limit_price !== undefined) {
          if (ord.side === 'BUY' && q.ask <= ord.limit_price) {
            shouldFill = true;
            fillRef = Math.min(q.ask, ord.limit_price);
          } else if (ord.side === 'SELL' && q.bid >= ord.limit_price) {
            shouldFill = true;
            fillRef = Math.max(q.bid, ord.limit_price);
          }
        } else if (ord.order_type === 'STOP_LOSS' && ord.stop_price !== undefined) {
          if (ord.side === 'SELL' && q.lastPrice <= ord.stop_price) {
            shouldFill = true;
            fillRef = q.bid;
          } else if (ord.side === 'BUY' && q.lastPrice >= ord.stop_price) {
            shouldFill = true;
            fillRef = q.ask;
          }
        }

        if (shouldFill) {
          const res = this.executeFill(ledger, ord, fillRef);
          if (res.ok) {
            matchedEvents.push({
              user_id: userId,
              order_id: ord.id,
              symbol: ord.symbol,
              price: ord.filled_price ?? fillRef,
            });
          }
        }
      }
    }
    return matchedEvents;
  }

  /**
   * Synchronize live quotes from Yahoo Finance (via Python quant service)
   * and match any resting PENDING orders against real prices.
   */
  public syncQuotesFromRealFeed(liveQuotes: MarketQuote[], dataSource: string) {
    for (const lq of liveQuotes) {
      const sym = lq.symbol.toUpperCase();
      const existing = this.store.quotes[sym];
      if (!existing) continue;
      this.store.quotes[sym] = {
        ...existing,
        ...lq,
        symbol: sym,
        dataSource,
      };
    }
    this.store.dataSource = dataSource;
    const matchedEvents = this.matchPendingOrders();
    this.saveStore();
    return {
      data_source: dataSource,
      synced_count: liveQuotes.length,
      matchedCount: matchedEvents.length,
      matchedEvents,
      quotes: this.getQuotes(),
    };
  }

  /**
   * Advance simulated market quotes by 1 deterministic tick (or apply an explicit price shock)
   * and match any resting PENDING Limit / Stop-Loss orders across all 5 user ledgers.
   */
  public stepMarketTick(shock?: { symbol: string; priceChangePct: number }) {
    this.store.tickCount += 1;
    const tick = this.store.tickCount;
    const now = new Date().toISOString();

    for (const sym of Object.keys(this.store.quotes)) {
      const q = this.store.quotes[sym];
      let pctMove = 0;

      if (shock && shock.symbol.toUpperCase() === sym) {
        pctMove = shock.priceChangePct / 100;
      } else {
        const seed = sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + tick * 31;
        const r = Math.sin(seed) * 10000;
        const unit = r - Math.floor(r); // [0, 1)
        const reversion = ((q.basePrice - q.lastPrice) / q.basePrice) * 0.12;
        pctMove = (unit - 0.495) * q.volatility * 0.5 + reversion;
      }

      const nextPrice = Math.max(1, Number((q.lastPrice * (1 + pctMove)).toFixed(2)));
      const { bid, ask } = makeSpread(nextPrice);
      q.lastPrice = nextPrice;
      q.bid = bid;
      q.ask = ask;
      q.change = Number((nextPrice - q.prevClose).toFixed(2));
      q.changePct = Number(((q.change / q.prevClose) * 100).toFixed(2));
      q.volume += Math.round(5000 + Math.abs(pctMove) * 1_500_000);
      q.updatedAt = now;
    }

    const matchedEvents = this.matchPendingOrders();
    this.saveStore();
    return {
      tick: this.store.tickCount,
      updatedAt: now,
      matchedCount: matchedEvents.length,
      matchedEvents,
      quotes: this.getQuotes(),
    };
  }

  public recordBacktestRun(entry: Omit<SavedBacktestSummary, 'id' | 'created_at'>) {
    const item: SavedBacktestSummary = {
      ...entry,
      id: `strat-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.store.strategies.unshift(item);
    this.store.strategies = this.store.strategies.slice(0, 30);
    this.saveStore();
    return item;
  }

  public getMultiUserLeaderboard() {
    const accountSummaries = USERS.map((u) => {
      const recon = this.getReconciledPortfolio(u.id);
      const userStrategies = this.store.strategies.filter((s) => s.user_id === u.id);
      const bestSharpe = userStrategies.length
        ? Math.max(...userStrategies.map((s) => s.sharpe_ratio))
        : 0;
      return {
        user_id: u.id,
        name: u.name,
        role: u.role,
        currency: u.currency,
        total_value: recon.portfolio.total_value,
        cash_balance: recon.portfolio.cash_balance,
        total_pnl: recon.portfolio.total_pnl,
        total_pnl_pct: recon.portfolio.total_pnl_pct,
        positions_count: recon.holdings.length,
        trades_count: recon.trades.length,
        backtests_count: userStrategies.length,
        best_sharpe: bestSharpe,
      };
    });

    return {
      accounts: accountSummaries,
      recent_strategies: this.store.strategies,
    };
  }

  public markNotificationsRead(userId: string) {
    const ledger = this.ensureLedger(userId);
    for (const n of ledger.notifications) n.read = true;
    this.saveStore();
    return ledger.notifications;
  }
}
