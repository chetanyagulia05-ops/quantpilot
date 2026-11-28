// ============================================================
// QuantPilot — Deterministic Order Matching & Execution Desk
// Supports Market, Limit, and Stop-Loss orders with live tick
// matching, bid/ask spread, slippage, and brokerage accounting.
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  StepForward,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import SegmentedControl from '@/components/ui/SegmentedControl';
import AnimatedList from '@/components/reactbits/AnimatedList';
import DecryptedText from '@/components/reactbits/DecryptedText';
import { formatCurrency, formatDate, formatPercent, getChangeColor } from '@/lib/utils';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import type { Order, Trade } from '@/types';

export default function PaperTrading() {
  const { currentUser } = useAuth();
  const {
    portfolio,
    orders,
    trades,
    quotes,
    placeOrder,
    cancelOrder,
    resetPortfolio,
    stepMarketTick,
    currency,
  } = usePortfolio();

  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [quantity, setQuantity] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const activeQuote = quotes.find((q) => q.symbol === selectedSymbol) ?? quotes[0];
  const currentPrice = activeQuote
    ? side === 'BUY'
      ? activeQuote.ask
      : activeQuote.bid
    : 1000;
  const [customPrice, setCustomPrice] = useState<number>(currentPrice);

  const activePrice = orderType === 'MARKET' ? currentPrice : customPrice;
  const estimatedTotal = quantity * activePrice;
  const assetCurrency = activeQuote?.currency ?? currency;
  const estimatedFee = assetCurrency === 'INR' ? 20.0 : 1.99;

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTickerChange = (sym: string) => {
    setSelectedSymbol(sym);
    const tick = quotes.find((q) => q.symbol === sym);
    if (tick) {
      setCustomPrice(tick.lastPrice);
    }
  };

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setNotification({ type: 'error', text: 'Order quantity must be at least 1 unit.' });
      return;
    }

    setSubmitting(true);
    const res = await placeOrder({
      symbol: selectedSymbol,
      name: activeQuote ? activeQuote.name : selectedSymbol,
      side,
      order_type: orderType,
      quantity,
      price: activePrice,
      limit_price: orderType === 'LIMIT' ? customPrice : undefined,
      stop_price: orderType === 'STOP_LOSS' ? customPrice : undefined,
    });
    setSubmitting(false);

    setNotification({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });

    setTimeout(() => setNotification(null), 5500);
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');

  const orderColumns: Column<Order>[] = [
    {
      key: 'symbol',
      header: 'Asset',
      render: (o) => (
        <div>
          <span className="font-mono font-semibold text-foreground">{o.symbol}</span>
          <span className="block text-[11px] text-muted-foreground">{o.name}</span>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (o) => <Badge variant={o.side === 'BUY' ? 'gain' : 'loss'}>{o.side}</Badge>,
    },
    {
      key: 'order_type',
      header: 'Type',
      render: (o) => <span className="font-mono text-[11px] text-muted-foreground">{o.order_type}</span>,
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      render: (o) => <span className="font-mono">{o.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Trigger Px',
      align: 'right',
      render: (o) => (
        <span className="font-mono">
          {formatCurrency(o.limit_price ?? o.stop_price ?? o.price, assetCurrency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'State',
      align: 'center',
      render: (o) => (
        <Badge variant="warning">
          <Clock className="h-3 w-3" />
          {o.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Queued',
      align: 'right',
      render: (o) => <span className="font-mono text-[11px] text-muted-foreground">{formatDate(o.created_at)}</span>,
    },
    {
      key: 'id',
      header: 'Action',
      align: 'center',
      render: (o) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => cancelOrder(o.id)}
          className="h-7 px-2 text-loss hover:text-loss"
          icon={<XCircle className="h-3.5 w-3.5" />}
        >
          Cancel
        </Button>
      ),
    },
  ];

  const tradeColumns: Column<Trade>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (t) => (
        <div>
          <span className="font-mono font-semibold text-foreground">{t.symbol}</span>
          <span className="block text-[11px] text-muted-foreground">{t.name}</span>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (t) => <Badge variant={t.side === 'BUY' ? 'gain' : 'loss'}>{t.side}</Badge>,
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      render: (t) => <span className="font-mono">{t.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Fill Price',
      align: 'right',
      render: (t) => <span className="font-mono">{formatCurrency(t.price, currency)}</span>,
    },
    {
      key: 'total',
      header: 'Notional',
      align: 'right',
      render: (t) => <span className="font-mono font-medium">{formatCurrency(t.total, currency)}</span>,
    },
    {
      key: 'fees',
      header: 'Fee',
      align: 'right',
      render: (t) => <span className="font-mono text-[11px] text-muted-foreground">{formatCurrency(t.fees, currency)}</span>,
    },
    {
      key: 'pnl',
      header: 'Realized P&L',
      align: 'right',
      render: (t) => (
        <span className={t.pnl !== undefined ? `font-mono font-semibold ${getChangeColor(t.pnl)}` : 'text-muted-foreground'}>
          {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}${formatCurrency(t.pnl, currency)}` : '—'}
        </span>
      ),
    },
    {
      key: 'executed_at',
      header: 'Timestamp',
      align: 'right',
      render: (t) => <span className="font-mono text-[11px] text-muted-foreground">{formatDate(t.executed_at)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Order Matching &amp; Execution Desk
            </h1>
            <Badge variant="info">
              <DecryptedText text="MATCH-ENGINE v2" animateOn="view" />
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Deterministic simulator with bid/ask spread, slippage &amp; resting limit/stop matching for{' '}
            <span className="font-semibold text-foreground">{currentUser.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<StepForward className="h-3.5 w-3.5 text-brand" />}
            onClick={() => stepMarketTick()}
          >
            Advance Market Tick
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={resetPortfolio}
          >
            Reset Ledger
          </Button>
        </div>
      </div>

      {/* Live Quote Strip & Stress Controls for Order Matching */}
      {activeQuote && (
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3 bg-secondary/40">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">Symbol</span>
              <span className="font-semibold text-foreground">{activeQuote.symbol}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">Last</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(activeQuote.lastPrice, activeQuote.currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">Bid / Ask</span>
              <span className="text-muted-foreground">
                {formatCurrency(activeQuote.bid, activeQuote.currency)} /{' '}
                {formatCurrency(activeQuote.ask, activeQuote.currency)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block">24h Move</span>
              <Badge variant={activeQuote.changePct >= 0 ? 'gain' : 'loss'}>
                {formatPercent(activeQuote.changePct)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[11px]"
              icon={<TrendingDown className="h-3 w-3 text-loss" />}
              onClick={() => stepMarketTick({ symbol: selectedSymbol, priceChangePct: -2.5 })}
            >
              Simulate -2.5% Dip
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[11px]"
              icon={<TrendingUp className="h-3 w-3 text-gain" />}
              onClick={() => stepMarketTick({ symbol: selectedSymbol, priceChangePct: 2.5 })}
            >
              Simulate +2.5% Rally
            </Button>
          </div>
        </Card>
      )}

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
            className={`rounded-md border px-3.5 py-2.5 text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-gain-light border-gain/40 text-gain'
                : 'bg-loss-light border-loss/40 text-loss'
            }`}
          >
            <span className="font-medium">{notification.text}</span>
            <button type="button" onClick={() => setNotification(null)} className="font-mono text-[11px] hover:underline cursor-pointer">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Ticket & Books */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <div className="mb-4 border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Order Ticket</h2>
            <p className="text-[11px] text-muted-foreground">
              Market (5 bps slip) · Limit/Stop (2 bps slip)
            </p>
          </div>

          <form onSubmit={handleExecuteOrder} className="space-y-4">
            <SegmentedControl
              layoutId="order-side-switch"
              value={side}
              onChange={setSide}
              className="w-full"
              options={[
                { value: 'BUY', label: 'BUY / LONG', tone: 'gain' },
                { value: 'SELL', label: 'SELL / EXIT', tone: 'loss' },
              ]}
            />

            <div>
              <label htmlFor="ord-symbol" className="block text-[11px] font-medium text-muted-foreground mb-1">
                Instrument
              </label>
              <select
                id="ord-symbol"
                value={selectedSymbol}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {quotes.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} — {formatCurrency(t.lastPrice, t.currency)} ({t.exchange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                Execution Type
              </span>
              <SegmentedControl
                layoutId="order-type-switch"
                size="sm"
                value={orderType}
                onChange={(val) => {
                  setOrderType(val);
                  if (activeQuote) setCustomPrice(activeQuote.lastPrice);
                }}
                className="w-full"
                options={[
                  { value: 'MARKET', label: 'Market' },
                  { value: 'LIMIT', label: 'Limit' },
                  { value: 'STOP_LOSS', label: 'Stop' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ord-qty" className="block text-[11px] font-medium text-muted-foreground mb-1">
                  Quantity
                </label>
                <input
                  id="ord-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {orderType !== 'MARKET' ? (
                <div>
                  <label htmlFor="ord-limit" className="block text-[11px] font-medium text-muted-foreground mb-1">
                    {orderType === 'LIMIT' ? 'Limit Price' : 'Stop Price'}
                  </label>
                  <input
                    id="ord-limit"
                    type="number"
                    step="0.05"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ) : (
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground mb-1">
                    Ref {side === 'BUY' ? 'Ask' : 'Bid'}
                  </span>
                  <div className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-xs font-mono text-foreground">
                    {formatCurrency(currentPrice, assetCurrency)}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-md border border-border bg-secondary/40 p-3 text-[11px] font-mono space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Est. Notional:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(estimatedTotal, assetCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Brokerage Fee:</span>
                <span className="text-foreground">{formatCurrency(estimatedFee, assetCurrency)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 text-muted-foreground">
                <span>Available Cash:</span>
                <span className="font-semibold text-brand">
                  {formatCurrency(portfolio.cash_balance, currency)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant={side === 'BUY' ? 'gain' : 'danger'}
              className="w-full"
              loading={submitting}
              icon={<ArrowLeftRight className="h-3.5 w-3.5" />}
            >
              Submit {orderType} {side}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-8 space-y-5">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Resting Order Book</h2>
                <p className="text-[11px] text-muted-foreground">
                  Limit and stop orders evaluated automatically on each market tick
                </p>
              </div>
              <Badge variant={pendingOrders.length > 0 ? 'warning' : 'neutral'}>
                {pendingOrders.length} Resting
              </Badge>
            </div>
            <DataTable
              caption="Resting limit and stop orders awaiting market match"
              columns={orderColumns}
              data={pendingOrders}
              keyExtractor={(o) => o.id}
              compact
              emptyMessage="No resting orders. Place a Limit or Stop order below/above market and step a tick to watch it match."
            />
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Executed Trade Ledger</h2>
                <p className="text-[11px] text-muted-foreground">
                  Verified fills with simulated slippage, brokerage &amp; realized P&amp;L
                </p>
              </div>
              <Badge variant="gain">
                <CheckCircle2 className="h-3 w-3" />
                {trades.length} Fills
              </Badge>
            </div>
            {trades.length <= 5 ? (
              <AnimatedList
                items={trades}
                keyExtractor={(t) => t.id}
                emptyMessage="No executed fills yet. Submit a Market order or trigger a Limit order."
                renderItem={(t) => (
                  <div className="flex items-center justify-between rounded-md border border-border bg-secondary/35 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Badge variant={t.side === 'BUY' ? 'gain' : 'loss'}>{t.side}</Badge>
                      <div>
                        <span className="font-mono font-semibold text-foreground">{t.symbol}</span>
                        <span className="ml-2 text-muted-foreground">
                          {t.quantity} @ {formatCurrency(t.price, currency)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="block font-medium text-foreground">
                        {formatCurrency(t.total, currency)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Fee {formatCurrency(t.fees, currency)}
                        {t.pnl !== undefined ? ` · P&L ${t.pnl >= 0 ? '+' : ''}${formatCurrency(t.pnl, currency)}` : ''}
                      </span>
                    </div>
                  </div>
                )}
              />
            ) : (
              <DataTable
                caption="Executed paper trading fills"
                columns={tradeColumns}
                data={trades}
                keyExtractor={(t) => t.id}
                compact
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
