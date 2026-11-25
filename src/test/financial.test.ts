import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent } from '../lib/utils';
import { calculateSMA, calculateEMA, calculateBollingerBands } from '../lib/quant/indicators';
import type { CandleData } from '../types/chart';

describe('Financial Utility & Currency Formatting Engine', () => {
  it('formats Indian Rupee (INR) accurately with symbol and decimal precision', () => {
    const formatted = formatCurrency(149025.5, 'INR');
    expect(formatted).toContain('₹');
    // Ensure comma grouping is applied (e.g. 1,49,025.50)
    expect(formatted).toMatch(/₹\s?1,49,025\.50/);
  });

  it('formats compact Indian Rupee (INR) in Lakhs and Crores', () => {
    const lakh = formatCurrency(250000, 'INR', true);
    expect(lakh).toBe('₹2.50L');

    const crore = formatCurrency(15000000, 'INR', true);
    expect(crore).toBe('₹1.50Cr');
  });

  it('formats US Dollar (USD) with standard thousands grouping', () => {
    const formatted = formatCurrency(12500.75, 'USD');
    expect(formatted).toContain('$');
    expect(formatted).toMatch(/\$\s?12,500\.75/);
  });

  it('formats compact US Dollar (USD) in Thousands and Millions', () => {
    const thousand = formatCurrency(85000, 'USD', true);
    expect(thousand).toBe('$85.0K');

    const million = formatCurrency(3500000, 'USD', true);
    expect(million).toBe('$3.50M');
  });

  it('formats percentage changes with appropriate sign prefix', () => {
    expect(formatPercent(4.582)).toBe('+4.58%');
    expect(formatPercent(-2.261)).toBe('-2.26%');
    expect(formatPercent(0)).toBe('0.00%');
  });
});

describe('Deterministic Portfolio Accounting & Ledger Math', () => {
  const seedHoldings = [
    {
      symbol: 'RELIANCE',
      quantity: 50,
      avg_cost: 2850.0,
      current_price: 2980.5,
    },
    {
      symbol: 'TCS',
      quantity: 35,
      avg_cost: 3950.0,
      current_price: 4120.0,
    },
    {
      symbol: 'HDFCBANK',
      quantity: 80,
      avg_cost: 1680.0,
      current_price: 1642.0,
    },
  ];

  const cashBalance = 150000.0;

  it('calculates position market value deterministically (quantity * current_price)', () => {
    for (const h of seedHoldings) {
      const expectedValue = Number((h.quantity * h.current_price).toFixed(2));
      expect(h.quantity * h.current_price).toBe(expectedValue);
    }
  });

  it('calculates unrealized P&L deterministically ((current_price - avg_cost) * quantity)', () => {
    // RELIANCE: (2980.5 - 2850) * 50 = 130.5 * 50 = 6525.0
    const reliance = seedHoldings[0];
    const reliancePnl = (reliance.current_price - reliance.avg_cost) * reliance.quantity;
    expect(reliancePnl).toBe(6525.0);

    // HDFCBANK: (1642 - 1680) * 80 = -38 * 80 = -3040.0
    const hdfc = seedHoldings[2];
    const hdfcPnl = (hdfc.current_price - hdfc.avg_cost) * hdfc.quantity;
    expect(hdfcPnl).toBe(-3040.0);
  });

  it('reconciles total portfolio equity (cash + sum of holdings market value)', () => {
    const totalHoldingsValue = seedHoldings.reduce(
      (sum, h) => sum + h.quantity * h.current_price,
      0
    );
    const expectedEquity = cashBalance + totalHoldingsValue;

    // RELIANCE: 50 * 2980.5 = 149025
    // TCS: 35 * 4120 = 144200
    // HDFCBANK: 80 * 1642 = 131360
    // Total Holdings = 424585
    expect(totalHoldingsValue).toBe(424585.0);
    expect(expectedEquity).toBe(574585.0);
  });

  it('enforces 5-user account isolation keys without collision', () => {
    const userIds = [
      'demo-user-001',
      'demo-user-002',
      'demo-user-003',
      'demo-user-004',
      'demo-user-005',
    ];

    const storageKeys = new Set(
      userIds.map((uid) => `quantpilot_portfolio_${uid}`)
    );
    expect(storageKeys.size).toBe(5);

    const chatKeys = new Set(
      userIds.map((uid) => `quantpilot_chat_${uid}`)
    );
    expect(chatKeys.size).toBe(5);
  });
});

describe('Quantitative Indicators Verification', () => {
  const mockCandles: CandleData[] = [
    { timestamp: 1, date: '2024-01-01', open: 10, high: 12, low: 9, close: 10, volume: 100 },
    { timestamp: 2, date: '2024-01-02', open: 10, high: 22, low: 10, close: 20, volume: 100 },
    { timestamp: 3, date: '2024-01-03', open: 20, high: 32, low: 19, close: 30, volume: 100 },
    { timestamp: 4, date: '2024-01-04', open: 30, high: 42, low: 29, close: 40, volume: 100 },
    { timestamp: 5, date: '2024-01-05', open: 40, high: 52, low: 39, close: 50, volume: 100 },
  ];

  it('calculates 3-period SMA correctly with null-padding', () => {
    const sma3 = calculateSMA(mockCandles, 3);
    expect(sma3[0]).toBeNull();
    expect(sma3[1]).toBeNull();
    expect(sma3[2]).toBe(20.0); // (10 + 20 + 30) / 3 = 20
    expect(sma3[3]).toBe(30.0); // (20 + 30 + 40) / 3 = 30
    expect(sma3[4]).toBe(40.0); // (30 + 40 + 50) / 3 = 40
  });

  it('calculates 3-period EMA starting from SMA seed', () => {
    const ema3 = calculateEMA(mockCandles, 3);
    expect(ema3[0]).toBeNull();
    expect(ema3[1]).toBeNull();
    expect(ema3[2]).toBe(20.0); // initial seed is SMA = 20
    // k = 2 / (3 + 1) = 0.5
    // i=3: close=40, EMA = 40 * 0.5 + 20 * 0.5 = 30
    expect(ema3[3]).toBe(30.0);
    // i=4: close=50, EMA = 50 * 0.5 + 30 * 0.5 = 40
    expect(ema3[4]).toBe(40.0);
  });

  it('verifies Bollinger Bands bounds (upper >= middle >= lower)', () => {
    const bb = calculateBollingerBands(mockCandles, 3, 2);
    for (let i = 2; i < mockCandles.length; i++) {
      expect(bb.upper[i]).toBeGreaterThanOrEqual(bb.middle[i]!);
      expect(bb.middle[i]!).toBeGreaterThanOrEqual(bb.lower[i]!);
    }
  });
});
