// ============================================================
// QuantPilot — Synthetic Demo Data
// ⚠️ ALL DATA IN THIS FILE IS SYNTHETIC / FABRICATED.
// It exists solely for visual development and UI testing.
// NONE of this represents real market data or trading results.
// ============================================================

import type {
  DemoMeta,
  Portfolio,
  Holding,
  Order,
  Trade,
  WatchlistItem,
  MarketIndex,
  SectorPerformance,
  NewsItem,
  ChatMessage,
  ChartDataPoint,
  TopMover,
} from '@/types';

const META: DemoMeta = {
  source: 'DEMO',
  generatedAt: '2024-01-15T10:00:00Z',
  disclaimer: 'This is synthetic demo data for UI development. Not real market data.',
};

// ── Portfolio ────────────────────────────────────────────────

export const demoPortfolio: Portfolio = {
  id: 'demo-portfolio-001',
  user_id: 'demo-user-001',
  name: 'My Paper Portfolio',
  cash_balance: 24350.0,
  total_value: 127845.62,
  total_invested: 100000.0,
  total_pnl: 27845.62,
  total_pnl_pct: 27.85,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  _meta: META,
};

// ── Holdings ─────────────────────────────────────────────────

export const demoHoldings: Holding[] = [
  {
    id: 'h-001',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    quantity: 50,
    avg_cost: 178.25,
    current_price: 192.53,
    market_value: 9626.5,
    unrealized_pnl: 714.0,
    unrealized_pnl_pct: 8.01,
    allocation_pct: 9.3,
    sector: 'Technology',
    _meta: META,
  },
  {
    id: 'h-002',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    quantity: 30,
    avg_cost: 362.1,
    current_price: 398.72,
    market_value: 11961.6,
    unrealized_pnl: 1098.6,
    unrealized_pnl_pct: 10.12,
    allocation_pct: 11.6,
    sector: 'Technology',
    _meta: META,
  },
  {
    id: 'h-003',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    quantity: 40,
    avg_cost: 138.5,
    current_price: 155.72,
    market_value: 6228.8,
    unrealized_pnl: 688.8,
    unrealized_pnl_pct: 12.44,
    allocation_pct: 6.0,
    sector: 'Technology',
    _meta: META,
  },
  {
    id: 'h-004',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    quantity: 35,
    avg_cost: 148.3,
    current_price: 178.25,
    market_value: 6238.75,
    unrealized_pnl: 1048.25,
    unrealized_pnl_pct: 20.18,
    allocation_pct: 6.0,
    sector: 'Consumer Cyclical',
    _meta: META,
  },
  {
    id: 'h-005',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    quantity: 25,
    avg_cost: 480.0,
    current_price: 682.35,
    market_value: 17058.75,
    unrealized_pnl: 5058.75,
    unrealized_pnl_pct: 42.16,
    allocation_pct: 16.5,
    sector: 'Technology',
    _meta: META,
  },
  {
    id: 'h-006',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    quantity: 45,
    avg_cost: 155.8,
    current_price: 183.42,
    market_value: 8253.9,
    unrealized_pnl: 1242.9,
    unrealized_pnl_pct: 17.73,
    allocation_pct: 8.0,
    sector: 'Financial Services',
    _meta: META,
  },
  {
    id: 'h-007',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    quantity: 60,
    avg_cost: 158.2,
    current_price: 162.45,
    market_value: 9747.0,
    unrealized_pnl: 255.0,
    unrealized_pnl_pct: 2.69,
    allocation_pct: 9.4,
    sector: 'Healthcare',
    _meta: META,
  },
  {
    id: 'h-008',
    user_id: 'demo-user-001',
    portfolio_id: 'demo-portfolio-001',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    quantity: 20,
    avg_cost: 242.5,
    current_price: 218.89,
    market_value: 4377.8,
    unrealized_pnl: -472.2,
    unrealized_pnl_pct: -9.73,
    allocation_pct: 4.2,
    sector: 'Consumer Cyclical',
    _meta: META,
  },
];

// ── Watchlist ─────────────────────────────────────────────────

export const demoWatchlist: WatchlistItem[] = [
  { id: 'w-001', user_id: 'demo-user-001', symbol: 'META', name: 'Meta Platforms', current_price: 474.99, change: 8.32, change_pct: 1.78, volume: 18400000, market_cap: 1210000000000, sector: 'Technology', _meta: META },
  { id: 'w-002', user_id: 'demo-user-001', symbol: 'V', name: 'Visa Inc.', current_price: 275.31, change: -1.24, change_pct: -0.45, volume: 6200000, market_cap: 565000000000, sector: 'Financial Services', _meta: META },
  { id: 'w-003', user_id: 'demo-user-001', symbol: 'UNH', name: 'UnitedHealth Group', current_price: 526.72, change: 3.18, change_pct: 0.61, volume: 3100000, market_cap: 489000000000, sector: 'Healthcare', _meta: META },
  { id: 'w-004', user_id: 'demo-user-001', symbol: 'AMD', name: 'Advanced Micro Devices', current_price: 147.41, change: -3.52, change_pct: -2.33, volume: 52000000, market_cap: 238000000000, sector: 'Technology', _meta: META },
  { id: 'w-005', user_id: 'demo-user-001', symbol: 'DIS', name: 'Walt Disney Co.', current_price: 95.28, change: 1.45, change_pct: 1.54, volume: 9800000, market_cap: 174000000000, sector: 'Communication', _meta: META },
];

// ── Market Indices ────────────────────────────────────────────

export const demoMarketIndices: MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 4783.83, change: 25.42, change_pct: 0.53, _meta: META },
  { symbol: 'DJI', name: 'Dow Jones', value: 37592.98, change: 112.34, change_pct: 0.30, _meta: META },
  { symbol: 'IXIC', name: 'NASDAQ', value: 15055.65, change: 78.81, change_pct: 0.53, _meta: META },
  { symbol: 'RUT', name: 'Russell 2000', value: 2012.73, change: -8.45, change_pct: -0.42, _meta: META },
];

// ── Sector Performance ────────────────────────────────────────

export const demoSectors: SectorPerformance[] = [
  { name: 'Technology', change_pct: 2.34, market_cap: 14200000000000, _meta: META },
  { name: 'Healthcare', change_pct: 0.87, market_cap: 7100000000000, _meta: META },
  { name: 'Financial Services', change_pct: 1.12, market_cap: 8900000000000, _meta: META },
  { name: 'Consumer Cyclical', change_pct: -0.45, market_cap: 5600000000000, _meta: META },
  { name: 'Communication', change_pct: 1.56, market_cap: 4200000000000, _meta: META },
  { name: 'Industrial', change_pct: 0.23, market_cap: 5100000000000, _meta: META },
  { name: 'Energy', change_pct: -1.82, market_cap: 3800000000000, _meta: META },
  { name: 'Utilities', change_pct: -0.31, market_cap: 1500000000000, _meta: META },
  { name: 'Real Estate', change_pct: 0.15, market_cap: 1200000000000, _meta: META },
  { name: 'Materials', change_pct: -0.67, market_cap: 900000000000, _meta: META },
];

// ── Top Movers ────────────────────────────────────────────────

export const demoTopGainers: TopMover[] = [
  { symbol: 'SMCI', name: 'Super Micro Computer', price: 542.13, change: 48.72, change_pct: 9.87, volume: 32000000 },
  { symbol: 'CRWD', name: 'CrowdStrike', price: 298.45, change: 18.42, change_pct: 6.58, volume: 8900000 },
  { symbol: 'PANW', name: 'Palo Alto Networks', price: 345.67, change: 15.23, change_pct: 4.61, volume: 5400000 },
  { symbol: 'NOW', name: 'ServiceNow', price: 712.89, change: 28.45, change_pct: 4.16, volume: 2100000 },
  { symbol: 'ANET', name: 'Arista Networks', price: 278.34, change: 9.87, change_pct: 3.68, volume: 3200000 },
];

export const demoTopLosers: TopMover[] = [
  { symbol: 'ENPH', name: 'Enphase Energy', price: 108.23, change: -12.45, change_pct: -10.32, volume: 15000000 },
  { symbol: 'MRNA', name: 'Moderna', price: 89.56, change: -7.82, change_pct: -8.03, volume: 12000000 },
  { symbol: 'RIVN', name: 'Rivian Automotive', price: 16.42, change: -1.18, change_pct: -6.71, volume: 28000000 },
  { symbol: 'PLUG', name: 'Plug Power', price: 3.87, change: -0.24, change_pct: -5.84, volume: 42000000 },
  { symbol: 'COIN', name: 'Coinbase Global', price: 148.92, change: -8.34, change_pct: -5.30, volume: 9800000 },
];

// ── Orders ────────────────────────────────────────────────────

export const demoOrders: Order[] = [
  { id: 'o-001', user_id: 'demo-user-001', portfolio_id: 'demo-portfolio-001', symbol: 'META', name: 'Meta Platforms', side: 'BUY', order_type: 'LIMIT', quantity: 10, price: 470.0, limit_price: 470.0, status: 'PENDING', created_at: '2024-01-15T09:30:00Z', fees: 0, _meta: META },
  { id: 'o-002', user_id: 'demo-user-001', portfolio_id: 'demo-portfolio-001', symbol: 'AAPL', name: 'Apple Inc.', side: 'BUY', order_type: 'MARKET', quantity: 15, price: 192.53, status: 'FILLED', filled_at: '2024-01-15T09:35:00Z', created_at: '2024-01-15T09:34:00Z', fees: 1.99, _meta: META },
  { id: 'o-003', user_id: 'demo-user-001', portfolio_id: 'demo-portfolio-001', symbol: 'TSLA', name: 'Tesla Inc.', side: 'SELL', order_type: 'STOP_LOSS', quantity: 5, price: 218.89, stop_price: 210.0, status: 'PENDING', created_at: '2024-01-14T14:20:00Z', fees: 0, _meta: META },
];

// ── Trades ─────────────────────────────────────────────────────

export const demoTrades: Trade[] = [
  { id: 't-001', user_id: 'demo-user-001', order_id: 'o-002', symbol: 'AAPL', name: 'Apple Inc.', side: 'BUY', quantity: 15, price: 192.53, total: 2887.95, fees: 1.99, executed_at: '2024-01-15T09:35:00Z', _meta: META },
  { id: 't-002', user_id: 'demo-user-001', order_id: 'o-010', symbol: 'NVDA', name: 'NVIDIA Corp.', side: 'BUY', quantity: 10, price: 545.0, total: 5450.0, fees: 1.99, executed_at: '2024-01-12T10:15:00Z', _meta: META },
  { id: 't-003', user_id: 'demo-user-001', order_id: 'o-011', symbol: 'GOOGL', name: 'Alphabet Inc.', side: 'SELL', quantity: 15, price: 148.2, total: 2223.0, fees: 1.99, pnl: 145.5, pnl_pct: 7.0, executed_at: '2024-01-10T11:45:00Z', _meta: META },
  { id: 't-004', user_id: 'demo-user-001', order_id: 'o-012', symbol: 'JPM', name: 'JPMorgan Chase', side: 'BUY', quantity: 20, price: 172.35, total: 3447.0, fees: 1.99, executed_at: '2024-01-08T13:20:00Z', _meta: META },
  { id: 't-005', user_id: 'demo-user-001', order_id: 'o-013', symbol: 'AMZN', name: 'Amazon.com Inc.', side: 'BUY', quantity: 15, price: 155.8, total: 2337.0, fees: 1.99, executed_at: '2024-01-05T09:50:00Z', _meta: META },
];

// ── Portfolio History Chart Data ───────────────────────────────

export const demoPortfolioHistory: ChartDataPoint[] = [
  { date: '2024-01-01', value: 100000, benchmark: 100000 },
  { date: '2024-01-02', value: 100850, benchmark: 100320 },
  { date: '2024-01-03', value: 101200, benchmark: 100580 },
  { date: '2024-01-04', value: 100400, benchmark: 100150 },
  { date: '2024-01-05', value: 103200, benchmark: 101200 },
  { date: '2024-01-06', value: 104500, benchmark: 101800 },
  { date: '2024-01-07', value: 106800, benchmark: 102400 },
  { date: '2024-01-08', value: 108200, benchmark: 102900 },
  { date: '2024-01-09', value: 107500, benchmark: 102100 },
  { date: '2024-01-10', value: 112000, benchmark: 103500 },
  { date: '2024-01-11', value: 115400, benchmark: 104200 },
  { date: '2024-01-12', value: 118900, benchmark: 104800 },
  { date: '2024-01-13', value: 121300, benchmark: 105500 },
  { date: '2024-01-14', value: 124600, benchmark: 106200 },
  { date: '2024-01-15', value: 127845, benchmark: 106800 },
];

// ── News ──────────────────────────────────────────────────────

export const demoNews: NewsItem[] = [
  {
    id: 'n-001',
    title: 'Fed Signals Potential Rate Cuts in Coming Months',
    summary: 'Federal Reserve officials indicated that interest rate reductions could begin as early as March, citing cooling inflation data and a balanced labor market.',
    source: 'Demo Financial Times',
    published_at: '2024-01-15T08:30:00Z',
    url: '#',
    category: 'economy',
    sentiment: 'positive',
    related_symbols: ['SPX', 'DJI'],
    _meta: META,
  },
  {
    id: 'n-002',
    title: 'NVIDIA Reports Record Revenue Driven by AI Demand',
    summary: 'NVIDIA\'s data center revenue surged 206% year-over-year as demand for AI training and inference chips continues to outpace supply.',
    source: 'Demo Reuters',
    published_at: '2024-01-15T07:15:00Z',
    url: '#',
    category: 'company',
    sentiment: 'positive',
    related_symbols: ['NVDA', 'AMD', 'SMCI'],
    _meta: META,
  },
  {
    id: 'n-003',
    title: 'Oil Prices Drop on Demand Concerns',
    summary: 'Crude oil futures fell 3.2% as weaker-than-expected economic data from major economies raised concerns about global energy demand.',
    source: 'Demo Bloomberg',
    published_at: '2024-01-15T06:00:00Z',
    url: '#',
    category: 'market',
    sentiment: 'negative',
    related_symbols: ['XOM', 'CVX'],
    _meta: META,
  },
  {
    id: 'n-004',
    title: 'EU Announces New Tech Regulation Framework',
    summary: 'The European Union unveiled updated digital market regulations that could impact how major tech companies operate in the region, with compliance deadlines set for mid-2024.',
    source: 'Demo BBC News',
    published_at: '2024-01-14T18:00:00Z',
    url: '#',
    category: 'geopolitical',
    sentiment: 'neutral',
    related_symbols: ['GOOGL', 'META', 'AAPL', 'MSFT'],
    _meta: META,
  },
  {
    id: 'n-005',
    title: 'Biotech Sector Sees Wave of M&A Activity',
    summary: 'Three major pharmaceutical acquisitions were announced this week, signaling renewed interest in biotech innovation and pipeline development.',
    source: 'Demo CNBC',
    published_at: '2024-01-14T14:30:00Z',
    url: '#',
    category: 'company',
    sentiment: 'positive',
    related_symbols: ['JNJ', 'PFE', 'MRNA'],
    _meta: META,
  },
  {
    id: 'n-006',
    title: 'Treasury Yields Decline Ahead of Inflation Data',
    summary: 'U.S. Treasury yields moved lower as investors await key inflation reports that could influence the Federal Reserve\'s next policy decision.',
    source: 'Demo Wall Street Journal',
    published_at: '2024-01-14T10:00:00Z',
    url: '#',
    category: 'economy',
    sentiment: 'neutral',
    related_symbols: ['TLT', 'SPX'],
    _meta: META,
  },
];

// ── AI Chat Messages ──────────────────────────────────────────

export const demoChatMessages: ChatMessage[] = [
  {
    id: 'c-001',
    user_id: 'demo-user-001',
    conversation_id: 'conv-001',
    role: 'user',
    content: 'What sectors are performing well this week?',
    created_at: '2024-01-15T09:00:00Z',
    _meta: META,
  },
  {
    id: 'c-002',
    user_id: 'demo-user-001',
    conversation_id: 'conv-001',
    role: 'assistant',
    content: '⚠️ DEMO RESPONSE — This is a simulated AI reply for UI development.\n\nBased on demo data, the Technology sector leads with +2.34%, followed by Communication Services at +1.56% and Financial Services at +1.12%. Energy is the weakest at -1.82%.\n\n**Disclaimer:** This is not investment advice. When connected to real data, I will provide analysis based on actual market conditions with appropriate risk disclosures.',
    created_at: '2024-01-15T09:00:05Z',
    _meta: META,
  },
];
