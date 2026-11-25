// ============================================================
// QuantPilot — Deterministic Portfolio & Paper Trading Ledger
// Reconciles cash, positions, realized & unrealized P&L,
// and enforces user account isolation per auth.uid().
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import type { Holding, Order, Trade, Portfolio } from '@/types';

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
  placeOrder: (input: OrderInput) => { success: boolean; message: string };
  cancelOrder: (orderId: string) => void;
  resetPortfolio: () => void;
  currency: 'INR' | 'USD';
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// Initial Indian Rupee Seed Holdings with Deterministic Math
function getSeedHoldings(userId: string): Holding[] {
  return [
    {
      id: `h-rel-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      quantity: 50,
      avg_cost: 2850.0,
      current_price: 2980.5,
      market_value: 149025.0, // 50 * 2980.5
      unrealized_pnl: 6525.0,  // (2980.5 - 2850) * 50
      unrealized_pnl_pct: 4.58,
      allocation_pct: 0, // dynamically calculated
      sector: 'Energy & Tech',
    },
    {
      id: `h-tcs-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      quantity: 35,
      avg_cost: 3950.0,
      current_price: 4120.0,
      market_value: 144200.0, // 35 * 4120
      unrealized_pnl: 5950.0,  // (4120 - 3950) * 35
      unrealized_pnl_pct: 4.30,
      allocation_pct: 0,
      sector: 'IT Services',
    },
    {
      id: `h-infy-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'INFY',
      name: 'Infosys Limited',
      quantity: 60,
      avg_cost: 1540.0,
      current_price: 1625.0,
      market_value: 97500.0, // 60 * 1625
      unrealized_pnl: 5100.0,
      unrealized_pnl_pct: 5.52,
      allocation_pct: 0,
      sector: 'IT Services',
    },
    {
      id: `h-hdfc-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd.',
      quantity: 80,
      avg_cost: 1680.0,
      current_price: 1642.0,
      market_value: 131360.0, // 80 * 1642
      unrealized_pnl: -3040.0,
      unrealized_pnl_pct: -2.26,
      allocation_pct: 0,
      sector: 'Financial Services',
    },
    {
      id: `h-tatam-${userId}`,
      user_id: userId,
      portfolio_id: `port-${userId}`,
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Ltd.',
      quantity: 100,
      avg_cost: 820.0,
      current_price: 935.0,
      market_value: 93500.0, // 100 * 935
      unrealized_pnl: 11500.0,
      unrealized_pnl_pct: 14.02,
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
}

const DEFAULT_INITIAL_CASH = 500000.0; // ₹5,00,000 cash balance + ~₹6,15,585 in holdings = ~₹11,15,585 total equity

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser.id;
  const storageKey = `quantpilot_ledger_${userId}`;

  // Load user-specific ledger
  const [ledger, setLedger] = useState<UserLedgerState>(() => {
    if (typeof window === 'undefined') {
      return {
        cash: DEFAULT_INITIAL_CASH,
        realizedPnl: 0,
        holdings: getSeedHoldings(userId),
        orders: [],
        trades: [],
      };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return {
      cash: DEFAULT_INITIAL_CASH,
      realizedPnl: 0,
      holdings: getSeedHoldings(userId),
      orders: [],
      trades: [],
    };
  });

  // When user switches, reload ledger for that user
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`quantpilot_ledger_${userId}`);
      if (stored) {
        setLedger(JSON.parse(stored));
      } else {
        const fresh: UserLedgerState = {
          cash: DEFAULT_INITIAL_CASH,
          realizedPnl: 0,
          holdings: getSeedHoldings(userId),
          orders: [],
          trades: [],
        };
        setLedger(fresh);
        localStorage.setItem(`quantpilot_ledger_${userId}`, JSON.stringify(fresh));
      }
    } catch {
      // ignore
    }
  }, [userId]);

  // Persist ledger changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(ledger));
    } catch {
      // ignore
    }
  }, [ledger, storageKey]);

  // Reconcile portfolio equity deterministically
  const holdingsValue = useMemo(() => {
    return ledger.holdings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
  }, [ledger.holdings]);

  const totalInvested = useMemo(() => {
    return ledger.holdings.reduce((sum, h) => sum + h.quantity * h.avg_cost, 0);
  }, [ledger.holdings]);

  const unrealizedPnl = useMemo(() => {
    return holdingsValue - totalInvested;
  }, [holdingsValue, totalInvested]);

  const totalEquity = useMemo(() => {
    return ledger.cash + holdingsValue;
  }, [ledger.cash, holdingsValue]);

  const totalPnl = useMemo(() => {
    return ledger.realizedPnl + unrealizedPnl;
  }, [ledger.realizedPnl, unrealizedPnl]);

  const totalPnlPct = useMemo(() => {
    const base = totalInvested > 0 ? totalInvested : DEFAULT_INITIAL_CASH;
    return (totalPnl / base) * 100;
  }, [totalPnl, totalInvested]);

  // Normalized holdings with correct allocation percentage
  const normalizedHoldings = useMemo(() => {
    return ledger.holdings.map((h) => {
      const mVal = h.quantity * h.current_price;
      const uPnl = (h.current_price - h.avg_cost) * h.quantity;
      const uPnlPct = h.avg_cost > 0 ? (uPnl / (h.avg_cost * h.quantity)) * 100 : 0;
      const alloc = totalEquity > 0 ? Number(((mVal / totalEquity) * 100).toFixed(1)) : 0;
      return {
        ...h,
        market_value: mVal,
        unrealized_pnl: uPnl,
        unrealized_pnl_pct: uPnlPct,
        allocation_pct: alloc,
      };
    });
  }, [ledger.holdings, totalEquity]);

  const portfolio: Portfolio = useMemo(() => {
    return {
      id: `port-${userId}`,
      user_id: userId,
      name: `${currentUser.name}'s Portfolio`,
      cash_balance: Number(ledger.cash.toFixed(2)),
      total_value: Number(totalEquity.toFixed(2)),
      total_invested: Number(totalInvested.toFixed(2)),
      total_pnl: Number(totalPnl.toFixed(2)),
      total_pnl_pct: Number(totalPnlPct.toFixed(2)),
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString(),
      _meta: {
        source: 'DEMO',
        generatedAt: new Date().toISOString(),
        disclaimer: 'Deterministic simulated paper trading portfolio ledger.',
      },
    };
  }, [userId, currentUser.name, ledger.cash, totalEquity, totalInvested, totalPnl, totalPnlPct]);

  // Execute or record an order
  const placeOrder = React.useCallback(
    (input: OrderInput): { success: boolean; message: string } => {
      const qty = Math.floor(input.quantity);
    if (qty <= 0) {
      return { success: false, message: 'Quantity must be at least 1 share.' };
    }

    const execPrice = input.price > 0 ? input.price : 100;
    const estTotal = qty * execPrice;
    const simulatedFee = 20.0; // ₹20 flat brokerage fee standard in India

    if (input.side === 'BUY') {
      const totalRequired = estTotal + simulatedFee;
      if (ledger.cash < totalRequired) {
        return {
          success: false,
          message: `Insufficient buying power. Required ₹${totalRequired.toFixed(2)}, Available: ₹${ledger.cash.toFixed(2)}`,
        };
      }
    } else {
      // SELL validation
      const existing = ledger.holdings.find((h) => h.symbol === input.symbol);
      if (!existing || existing.quantity < qty) {
        return {
          success: false,
          message: `Insufficient shares. You own ${existing ? existing.quantity : 0} shares of ${input.symbol}.`,
        };
      }
    }

    const orderId = `ord-${Date.now()}`;
    const timestamp = new Date().toISOString();

    if (input.order_type === 'MARKET') {
      // Execute trade immediately
      const tradeId = `trd-${Date.now()}`;

      if (input.side === 'BUY') {
        const costWithFee = estTotal + simulatedFee;
        setLedger((prev) => {
          const existingIdx = prev.holdings.findIndex((h) => h.symbol === input.symbol);
          let updatedHoldings: Holding[];

          if (existingIdx >= 0) {
            const cur = prev.holdings[existingIdx];
            const newTotalQty = cur.quantity + qty;
            const newAvgCost = (cur.quantity * cur.avg_cost + estTotal) / newTotalQty;
            updatedHoldings = [...prev.holdings];
            updatedHoldings[existingIdx] = {
              ...cur,
              quantity: newTotalQty,
              avg_cost: Number(newAvgCost.toFixed(2)),
              current_price: execPrice,
            };
          } else {
            const newHolding: Holding = {
              id: `h-${input.symbol}-${userId}`,
              user_id: userId,
              portfolio_id: `port-${userId}`,
              symbol: input.symbol,
              name: input.name,
              quantity: qty,
              avg_cost: execPrice,
              current_price: execPrice,
              market_value: estTotal,
              unrealized_pnl: 0,
              unrealized_pnl_pct: 0,
              allocation_pct: 0,
              sector: 'Equities',
            };
            updatedHoldings = [...prev.holdings, newHolding];
          }

          const newTrade: Trade = {
            id: tradeId,
            user_id: userId,
            order_id: orderId,
            symbol: input.symbol,
            name: input.name,
            side: 'BUY',
            quantity: qty,
            price: execPrice,
            total: estTotal,
            fees: simulatedFee,
            executed_at: timestamp,
          };

          return {
            ...prev,
            cash: prev.cash - costWithFee,
            holdings: updatedHoldings,
            trades: [newTrade, ...prev.trades],
          };
        });

        return {
          success: true,
          message: `Executed BUY ${qty} shares of ${input.symbol} at ₹${execPrice.toFixed(2)}.`,
        };
      } else {
        // SELL execution
        setLedger((prev) => {
          const existing = prev.holdings.find((h) => h.symbol === input.symbol)!;
          const realizedTradePnl = (execPrice - existing.avg_cost) * qty - simulatedFee;
          const netProceeds = estTotal - simulatedFee;

          let updatedHoldings: Holding[];
          if (existing.quantity === qty) {
            updatedHoldings = prev.holdings.filter((h) => h.symbol !== input.symbol);
          } else {
            updatedHoldings = prev.holdings.map((h) =>
              h.symbol === input.symbol ? { ...h, quantity: h.quantity - qty } : h
            );
          }

          const newTrade: Trade = {
            id: tradeId,
            user_id: userId,
            order_id: orderId,
            symbol: input.symbol,
            name: input.name,
            side: 'SELL',
            quantity: qty,
            price: execPrice,
            total: estTotal,
            fees: simulatedFee,
            pnl: Number(realizedTradePnl.toFixed(2)),
            pnl_pct: Number((((execPrice - existing.avg_cost) / existing.avg_cost) * 100).toFixed(2)),
            executed_at: timestamp,
          };

          return {
            ...prev,
            cash: prev.cash + netProceeds,
            realizedPnl: prev.realizedPnl + realizedTradePnl,
            holdings: updatedHoldings,
            trades: [newTrade, ...prev.trades],
          };
        });

        return {
          success: true,
          message: `Executed SELL ${qty} shares of ${input.symbol} at ₹${execPrice.toFixed(2)}.`,
        };
      }
    } else {
      // Pending Limit or Stop Loss order
      const newOrder: Order = {
        id: orderId,
        user_id: userId,
        portfolio_id: `port-${userId}`,
        symbol: input.symbol,
        name: input.name,
        side: input.side,
        order_type: input.order_type,
        quantity: qty,
        price: execPrice,
        limit_price: input.limit_price,
        stop_price: input.stop_price,
        status: 'PENDING',
        created_at: timestamp,
        fees: simulatedFee,
      };

      setLedger((prev) => ({
        ...prev,
        orders: [newOrder, ...prev.orders],
      }));

      return {
        success: true,
        message: `Placed ${input.order_type} ${input.side} order for ${qty} shares of ${input.symbol}.`,
      };
    }
  }, [userId, ledger.cash]);

  const cancelOrder = React.useCallback((orderId: string) => {
    setLedger((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o)),
    }));
  }, []);

  const resetPortfolio = React.useCallback(() => {
    const fresh: UserLedgerState = {
      cash: DEFAULT_INITIAL_CASH,
      realizedPnl: 0,
      holdings: getSeedHoldings(userId),
      orders: [],
      trades: [],
    };
    setLedger(fresh);
  }, [userId]);

  const value = useMemo(
    () => ({
      portfolio,
      holdings: normalizedHoldings,
      orders: ledger.orders,
      trades: ledger.trades,
      placeOrder,
      cancelOrder,
      resetPortfolio,
      currency: currentUser.preferredCurrency,
    }),
    [portfolio, normalizedHoldings, ledger.orders, ledger.trades, placeOrder, cancelOrder, resetPortfolio, currentUser.preferredCurrency]
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
