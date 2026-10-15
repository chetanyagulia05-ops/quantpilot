// ============================================================
// QuantPilot — Domain Type Definitions
// All entity types include user_id for future RLS enforcement.
// All demo objects include _meta for data-source transparency.
// ============================================================

/** Metadata attached to every demo data object */
export interface DemoMeta {
  source: 'DEMO';
  generatedAt: string;
  disclaimer: string;
}

/** Portfolio belonging to an authenticated user */
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  cash_balance: number;
  total_value: number;
  total_invested: number;
  total_pnl: number;
  total_pnl_pct: number;
  created_at: string;
  updated_at: string;
  _meta?: DemoMeta;
}

/** Individual stock holding within a portfolio */
export interface Holding {
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
  _meta?: DemoMeta;
}

/** Paper trade order */
export interface Order {
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
  created_at: string;
  fees: number;
  _meta?: DemoMeta;
}

/** Executed paper trade */
export interface Trade {
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
  pnl?: number;
  pnl_pct?: number;
  executed_at: string;
  _meta?: DemoMeta;
}

/** Watchlist item */
export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  current_price: number;
  change: number;
  change_pct: number;
  volume: number;
  market_cap: number;
  sector: string;
  _meta?: DemoMeta;
}

/** Market index data */
export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  change_pct: number;
  _meta?: DemoMeta;
}

/** Sector performance */
export interface SectorPerformance {
  name: string;
  change_pct: number;
  market_cap: number;
  _meta?: DemoMeta;
}

/** News item */
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
  url: string;
  category: 'market' | 'company' | 'economy' | 'geopolitical' | 'technology';
  sentiment: 'positive' | 'negative' | 'neutral';
  related_symbols: string[];
  _meta?: DemoMeta;
}

/** AI assistant conversation message */
export interface ChatMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  _meta?: DemoMeta;
}

/** Chart data point for portfolio history */
export interface ChartDataPoint {
  date: string;
  value: number;
  benchmark?: number;
}

/** Top mover stock */
export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
}

/** Navigation item for sidebar */
export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

/** User settings */
export interface UserSettings {
  user_id: string;
  display_name: string;
  email: string;
  currency: 'USD' | 'INR' | 'EUR';
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  paper_trading_enabled: boolean;
}
