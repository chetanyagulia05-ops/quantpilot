// ============================================================
// QuantPilot — High-Resolution OHLCV Market Dataset
// Synthetic historical candles for multi-asset research.
// Stamped with DEMO metadata for full transparency.
// ============================================================

import type { CandleData, Timeframe } from '@/types/chart';

export interface TickerInfo {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  basePrice: number;
  volatility: number;
  currency: string;
}

export const SUPPORTED_TICKERS: TickerInfo[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy & Digital', basePrice: 2980.50, volatility: 0.018, currency: 'INR' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services', basePrice: 4120.00, volatility: 0.014, currency: 'INR' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', sector: 'Financial Services', basePrice: 1642.00, volatility: 0.016, currency: 'INR' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', sector: 'IT Services', basePrice: 1625.00, volatility: 0.017, currency: 'INR' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE', sector: 'Automotive', basePrice: 935.00, volatility: 0.024, currency: 'INR' },
  { symbol: 'NIFTY50', name: 'NIFTY 50 Index', exchange: 'NSE Benchmark', sector: 'Indian Broad Market', basePrice: 22450.00, volatility: 0.011, currency: 'INR' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Semiconductors', basePrice: 682.35, volatility: 0.028, currency: 'USD' },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Consumer Electronics', basePrice: 192.53, volatility: 0.015, currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Enterprise Software', basePrice: 398.72, volatility: 0.018, currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Automotive / EV', basePrice: 218.89, volatility: 0.035, currency: 'USD' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE Arca', sector: 'US Broad Market', basePrice: 478.38, volatility: 0.011, currency: 'USD' },
];

/**
 * Deterministic pseudo-random number generator for reproducible charts
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate 260 historical daily candles for a given ticker
 */
export function generateCandlesForTicker(ticker: TickerInfo): CandleData[] {
  const candles: CandleData[] = [];
  const totalDays = 260;
  const now = new Date('2024-01-15T16:00:00Z');

  // Derive initial price 260 days back
  let currentClose = ticker.basePrice * 0.78; // overall positive trend over the year
  const seedBase = ticker.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 42);

  for (let i = totalDays; i >= 0; i--) {
    const candleDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Skip weekends
    const dayOfWeek = candleDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const seed = seedBase + i * 13;
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + 1);
    const r3 = seededRandom(seed + 2);
    const r4 = seededRandom(seed + 3);

    // Daily percentage return with slight upward bias
    const dailyDrift = 0.0008;
    const shock = (r1 - 0.48) * 2 * ticker.volatility;
    const pctChange = dailyDrift + shock;

    const open = Number(currentClose.toFixed(2));
    currentClose = Math.max(1, open * (1 + pctChange));
    const close = Number(currentClose.toFixed(2));

    const wickHighFactor = 1 + r2 * ticker.volatility * 0.8;
    const wickLowFactor = 1 - r3 * ticker.volatility * 0.8;

    const high = Number(Math.max(open, close, Math.max(open, close) * wickHighFactor).toFixed(2));
    const low = Number(Math.min(open, close, Math.min(open, close) * wickLowFactor).toFixed(2));

    // Base volume around 5-30 million shares with occasional spike
    const baseVol = ticker.symbol.length <= 4 ? 15_000_000 : 2_000_000;
    const volMultiplier = r4 > 0.85 ? 2.5 : 0.6 + r4 * 0.8;
    const volume = Math.round(baseVol * volMultiplier);

    const dateStr = candleDate.toISOString().split('T')[0];
    const timestamp = Math.floor(candleDate.getTime() / 1000);

    candles.push({
      timestamp,
      date: dateStr,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // Anchor final candle close to ticker.basePrice
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = ticker.basePrice;
    last.high = Math.max(last.high, ticker.basePrice * 1.01);
    last.low = Math.min(last.low, ticker.basePrice * 0.99);
  }

  return candles;
}

/**
 * Filter candle series by timeframe
 */
export function filterCandlesByTimeframe(
  candles: CandleData[],
  timeframe: Timeframe
): CandleData[] {
  if (candles.length === 0) return [];

  switch (timeframe) {
    case '1D':
      // Return last 10 candles (simulating recent intraday sessions)
      return candles.slice(-10);
    case '1W':
      return candles.slice(-7);
    case '1M':
      return candles.slice(-22);
    case '3M':
      return candles.slice(-66);
    case '1Y':
      return candles.slice(-250);
    case 'ALL':
    default:
      return candles;
  }
}
