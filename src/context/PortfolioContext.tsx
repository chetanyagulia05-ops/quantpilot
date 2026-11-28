// ============================================================
// QuantPilot — Deterministic Portfolio & Real Market Sync Context
// Synchronizes with Yahoo Finance via Node.js + Python Quant Engine,
// with deterministic local fallback if offline.
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { quantApi, type MarketQuote } from '@/lib/api';
import { SUPPORTED_TICKERS } from '@/data/ohlcvData';
import type { Holding, Order, Trade, Portfolio } from '@/types';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'trade' | 'alert' | 'system';
  read: boolean;
  timestamp: string;
}

interface OrderInput {
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  quantity: number;
  price: number;
  limit_price?: number;
  stop_price?: number;
}

interface PortfolioContextType {
  portfolio: Portfolio;
  holdings: Holding[];
  orders: Order[];
  trades: Trade[];
  quotes: MarketQuote[];
  notifications: NotificationItem[];
  backendConnected: boolean;
  pythonQuantOnline: boolean;
  dataSource: string;
  isSyncingData: boolean;
  autoTickEnabled: boolean;
  setAutoTickEnabled: (enabled: boolean) => void;
  lastMatchedNotice: string | null;
  clearLastMatchedNotice: () => void;
  placeOrder: (input: OrderInput) => Promise<{ success: boolean; message: string }>;
  cancelOrder: (orderId: string) => Promise<void>;
  resetPortfolio: () => Promise<void>;
  syncRealData: (refresh?: boolean) => Promise<void>;
  stepMarketTick: (shock?: { symbol: string; priceChangePct: number }) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  currency: 'INR' | 'USD';
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

function getSeedQuotes(): MarketQuote[] {
  const now = new Date().toISOString();
  return SUPPORTED_TICKERS.map((t) => {
    const half = Math.max(0.05, Number((t.basePrice * 0.0003).toFixed(2)));
    const prevClose = Number((t.basePrice * 0.992).toFixed(2));
    const change = Number((t.basePrice - prevClose).toFixed(2));
    return {
      symbol: t.symbol,
      name: t.name,
      exchange: t.exchange,
      sector: t.sector,
      currency: (t.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD',
      basePrice: t.basePrice,
      lastPrice: t.basePrice,
      bid: Number((t.basePrice - half).toFixed(2)),
      ask: Number((t.basePrice + half).toFixed(2)),
      prevClose,
      change,
      changePct: Number(((change / prevClose) * 100).toFixed(2)),
      volatility: t.volatility,
      volume: Math.round(t.basePrice * 4500),
      dataSource: 'INITIAL_SNAPSHOT',
      updatedAt: now,
    };
  });
}

function getSeedHoldings(userId: string): Holding[] {
  return [
    {
      id: `h-rel-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      quantity: 110,
      avg_cost: 1299.64,
      current_price: 1382.6,
      market_value: 152086.0,
      unrealized_pnl: 9125.6,
      unrealized_pnl_pct: 6.38,
      allocation_pct: 0,
      sector: 'Energy & Digital',
    },
    {
      id: `h-tcs-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      quantity: 55,
      avg_cost: 2443.88,
      current_price: 2572.5,
      market_value: 141487.5,
      unrealized_pnl: 7074.1,
      unrealized_pnl_pct: 5.26,
      allocation_pct: 0,
      sector: 'IT Services',
    },
    {
      id: `h-infy-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'INFY',
      name: 'Infosys Limited',
      quantity: 90,
      avg_cost: 1070.71,
      current_price: 1151.3,
      market_value: 103617.0,
      unrealized_pnl: 7253.1,
      unrealized_pnl_pct: 7.53,
      allocation_pct: 0,
      sector: 'IT Services',
    },
    {
      id: `h-hdfc-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd.',
      quantity: 140,
      avg_cost: 874.4,
      current_price: 857.25,
      market_value: 120015.0,
      unrealized_pnl: -2401.0,
      unrealized_pnl_pct: -1.96,
      allocation_pct: 0,
      sector: 'Financial Services',
    },
    {
      id: `h-tatam-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Passenger Vehicles',
      quantity: 280,
      avg_cost: 234.78,
      current_price: 258.0,
      market_value: 72240.0,
      unrealized_pnl: 6501.6,
      unrealized_pnl_pct: 9.89,
      allocation_pct: 0,
      sector: 'Automotive',
    },
  ];
}

interface UserLedgerState {
  cash: number;
  realizedPnl: number;
  holdings: Holding[];
  orders: Order[];
  trades: Trade[];
  notifications: NotificationItem[];
}

const DEFAULT_INITIAL_CASH = 500000.0;

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser.id;
  const storageKey = `quantpilot_ledger_v2_${userId}`;

  const [quotes, setQuotes] = useState<MarketQuote[]>(getSeedQuotes);
  const [backendConnected, setBackendConnected] = useState(false);
  const [pythonQuantOnline, setPythonQuantOnline] = useState(false);
  const [dataSource, setDataSource] = useState('INITIAL_SNAPSHOT');
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [autoTickEnabled, setAutoTickEnabled] = useState(false);
  const [lastMatchedNotice, setLastMatchedNotice] = useState<string | null>(null);

  const [ledger, setLedger] = useState<UserLedgerState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return {
      cash: DEFAULT_INITIAL_CASH,
      realizedPnl: 0,
      holdings: getSeedHoldings(userId),
      orders: [],
      trades: [],
      notifications: [],
    };
  });

  const applyServerState = useCallback((state: any) => {
    if (!state || !state.portfolio) return;
    if (state.data_source) setDataSource(state.data_source);
    setLedger({
      cash: Number(state.portfolio.cash_balance ?? DEFAULT_INITIAL_CASH),
      realizedPnl: Number(state.portfolio.realized_pnl ?? 0),
      holdings: state.holdings ?? [],
      orders: state.orders ?? [],
      trades: state.trades ?? [],
      notifications: state.notifications ?? [],
    });
  }, []);

  const refreshFromBackend = useCallback(async () => {
    try {
      const [health, qRes, pRes] = await Promise.all([
        quantApi.health(),
        quantApi.getQuotes(),
        quantApi.getPortfolio(userId),
      ]);
      setBackendConnected(true);
      setPythonQuantOnline(Boolean(health.python_quant_online));
      if (qRes.data_source) setDataSource(qRes.data_source);
      if (qRes.quotes?.length) setQuotes(qRes.quotes);
      applyServerState(pRes);
    } catch {
      setBackendConnected(false);
      setPythonQuantOnline(false);
      setDataSource('LOCAL_FALLBACK');
    }
  }, [userId, applyServerState]);

  useEffect(() => {
    refreshFromBackend();
  }, [refreshFromBackend]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ledger));
    } catch {
      // ignore
    }
  }, [ledger, storageKey]);

  const syncRealData = useCallback(
    async (refresh = true) => {
      setIsSyncingData(true);
      try {
        const syncRes = await quantApi.syncMarketData(refresh);
        setBackendConnected(true);
        setPythonQuantOnline(true);
        setDataSource(syncRes.data_source);
        if (syncRes.quotes?.length) setQuotes(syncRes.quotes);
        const pRes = await quantApi.getPortfolio(userId);
        applyServerState(pRes);

        const userMatches = (syncRes.matchedEvents || []).filter((m) => m.user_id === userId);
        if (userMatches.length > 0) {
          setLastMatchedNotice(
            `Real-data sync matched ${userMatches.map((m) => `${m.symbol} @ ${m.price.toFixed(2)}`).join(', ')}`
          );
        }
      } catch {
        // leave current state intact
      } finally {
        setIsSyncingData(false);
      }
    },
    [userId, applyServerState]
  );

  const stepMarketTick = useCallback(
    async (shock?: { symbol: string; priceChangePct: number }) => {
      try {
        const tickRes = await quantApi.stepTick(shock);
        setBackendConnected(true);
        if (tickRes.quotes?.length) setQuotes(tickRes.quotes);
        const pRes = await quantApi.getPortfolio(userId);
        applyServerState(pRes);

        const userMatches = (tickRes.matchedEvents || []).filter((m) => m.user_id === userId);
        if (userMatches.length > 0) {
          const summary = userMatches.map((m) => `${m.symbol} @ ${m.price.toFixed(2)}`).join(', ');
          setLastMatchedNotice(`Order Matching Engine executed: ${summary}`);
        }
      } catch {
        setQuotes((prev) =>
          prev.map((q) => {
            const pct =
              shock && shock.symbol === q.symbol
                ? shock.priceChangePct / 100
                : (Math.random() - 0.495) * q.volatility * 0.45;
            const nextPrice = Math.max(1, Number((q.lastPrice * (1 + pct)).toFixed(2)));
            const half = Math.max(0.05, Number((nextPrice * 0.0003).toFixed(2)));
            return {
              ...q,
              lastPrice: nextPrice,
              bid: Number((nextPrice - half).toFixed(2)),
              ask: Number((nextPrice + half).toFixed(2)),
              change: Number((nextPrice - q.prevClose).toFixed(2)),
              changePct: Number((((nextPrice - q.prevClose) / q.prevClose) * 100).toFixed(2)),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
    },
    [userId, applyServerState]
  );

  useEffect(() => {
    if (!autoTickEnabled) return;
    const id = window.setInterval(() => {
      stepMarketTick();
    }, 4000);
    return () => clearInterval(id);
  }, [autoTickEnabled, stepMarketTick]);

  const quoteMap = useMemo(() => {
    const m = new Map<string, MarketQuote>();
    for (const q of quotes) m.set(q.symbol, q);
    return m;
  }, [quotes]);

  const markedHoldings = useMemo(() => {
    return ledger.holdings.map((h) => {
      const q = quoteMap.get(h.symbol);
      const cp = q ? q.lastPrice : h.current_price;
      return { ...h, current_price: cp };
    });
  }, [ledger.holdings, quoteMap]);

  const holdingsValue = useMemo(
    () => markedHoldings.reduce((sum, h) => sum + h.quantity * h.current_price, 0),
    [markedHoldings]
  );

  const totalInvested = useMemo(
    () => markedHoldings.reduce((sum, h) => sum + h.quantity * h.avg_cost, 0),
    [markedHoldings]
  );

  const unrealizedPnl = holdingsValue - totalInvested;
  const totalEquity = ledger.cash + holdingsValue;
  const totalPnl = ledger.realizedPnl + unrealizedPnl;
  const totalPnlPct = useMemo(() => {
    const base = totalInvested > 0 ? totalInvested : DEFAULT_INITIAL_CASH;
    return (totalPnl / base) * 100;
  }, [totalPnl, totalInvested]);

  const normalizedHoldings = useMemo(() => {
    return markedHoldings.map((h) => {
      const mVal = h.quantity * h.current_price;
      const uPnl = (h.current_price - h.avg_cost) * h.quantity;
      const uPnlPct = h.avg_cost > 0 ? (uPnl / (h.avg_cost * h.quantity)) * 100 : 0;
      const alloc = totalEquity > 0 ? Number(((mVal / totalEquity) * 100).toFixed(1)) : 0;
      return {
        ...h,
        market_value: Number(mVal.toFixed(2)),
        unrealized_pnl: Number(uPnl.toFixed(2)),
        unrealized_pnl_pct: Number(uPnlPct.toFixed(2)),
        allocation_pct: alloc,
      };
    });
  }, [markedHoldings, totalEquity]);

  const portfolio: Portfolio = useMemo(
    () => ({
      id: `port-${userId}`,
      user_id: userId,
      name: `${currentUser.name}'s Portfolio`,
      cash_balance: Number(ledger.cash.toFixed(2)),
      total_value: Number(totalEquity.toFixed(2)),
      total_invested: Number(totalInvested.toFixed(2)),
      total_pnl: Number(totalPnl.toFixed(2)),
      total_pnl_pct: Number(totalPnlPct.toFixed(2)),
      created_at: '2025-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
    }),
    [userId, currentUser.name, ledger.cash, totalEquity, totalInvested, totalPnl, totalPnlPct]
  );

  const placeOrder = useCallback(
    async (input: OrderInput): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await quantApi.placeOrder(userId, {
          symbol: input.symbol,
          side: input.side,
          order_type: input.order_type,
          quantity: input.quantity,
          limit_price: input.limit_price,
          stop_price: input.stop_price,
        });
        if (res.state) applyServerState(res.state);
        return { success: res.success, message: res.message };
      } catch (err: any) {
        if (backendConnected && err?.message) {
          return { success: false, message: err.message };
        }
        return { success: false, message: 'API offline: unable to submit paper order.' };
      }
    },
    [userId, backendConnected, applyServerState]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      try {
        const res = await quantApi.cancelOrder(userId, orderId);
        if (res.state) applyServerState(res.state);
      } catch {
        setLedger((prev) => ({
          ...prev,
          orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
        }));
      }
    },
    [userId, applyServerState]
  );

  const resetPortfolio = useCallback(async () => {
    try {
      const state = await quantApi.resetPortfolio(userId);
      applyServerState(state);
    } catch {
      setLedger({
        cash: DEFAULT_INITIAL_CASH,
        realizedPnl: 0,
        holdings: getSeedHoldings(userId),
        orders: [],
        trades: [],
        notifications: [],
      });
    }
  }, [userId, applyServerState]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      const res = await quantApi.markNotificationsRead(userId);
      setLedger((prev) => ({ ...prev, notifications: res.notifications ?? [] }));
    } catch {
      setLedger((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      }));
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      portfolio,
      holdings: normalizedHoldings,
      orders: ledger.orders,
      trades: ledger.trades,
      quotes,
      notifications: ledger.notifications,
      backendConnected,
      pythonQuantOnline,
      dataSource,
      isSyncingData,
      autoTickEnabled,
      setAutoTickEnabled,
      lastMatchedNotice,
      clearLastMatchedNotice: () => setLastMatchedNotice(null),
      placeOrder,
      cancelOrder,
      resetPortfolio,
      syncRealData,
      stepMarketTick,
      markAllNotificationsRead,
      currency: currentUser.preferredCurrency,
    }),
    [
      portfolio,
      normalizedHoldings,
      ledger.orders,
      ledger.trades,
      ledger.notifications,
      quotes,
      backendConnected,
      pythonQuantOnline,
      dataSource,
      isSyncingData,
      autoTickEnabled,
      lastMatchedNotice,
      placeOrder,
      cancelOrder,
      resetPortfolio,
      syncRealData,
      stepMarketTick,
      markAllNotificationsRead,
      currentUser.preferredCurrency,
    ]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioContextType {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
