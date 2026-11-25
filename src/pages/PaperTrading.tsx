import { useState } from 'react';
import { Info, ArrowLeftRight, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate, getChangeColor } from '@/lib/utils';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_TICKERS } from '@/data/ohlcvData';
import type { Order, Trade } from '@/types';

export default function PaperTrading() {
  const { currentUser } = useAuth();
  const { portfolio, orders, trades, placeOrder, cancelOrder, resetPortfolio, currency } = usePortfolio();

  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
  const [quantity, setQuantity] = useState(10);

  const matchedTicker = SUPPORTED_TICKERS.find((t) => t.symbol === selectedSymbol);
  const currentPrice = matchedTicker ? matchedTicker.basePrice : 1000;
  const [customPrice, setCustomPrice] = useState<number>(currentPrice);

  const activePrice = orderType === 'MARKET' ? currentPrice : customPrice;
  const estimatedTotal = quantity * activePrice;
  const estimatedFee = currency === 'INR' ? 20.0 : 1.99;

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTickerChange = (sym: string) => {
    setSelectedSymbol(sym);
    const tick = SUPPORTED_TICKERS.find((t) => t.symbol === sym);
    if (tick) {
      setCustomPrice(tick.basePrice);
    }
  };

  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setNotification({ type: 'error', text: 'Order quantity must be at least 1 unit.' });
      return;
    }

    const res = placeOrder({
      symbol: selectedSymbol,
      name: matchedTicker ? matchedTicker.name : selectedSymbol,
      side,
      order_type: orderType,
      quantity,
      price: activePrice,
      limit_price: orderType === 'LIMIT' ? customPrice : undefined,
      stop_price: orderType === 'STOP_LOSS' ? customPrice : undefined,
    });

    if (res.success) {
      setNotification({ type: 'success', text: res.message });
    } else {
      setNotification({ type: 'error', text: res.message });
    }

    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');

  const orderColumns: Column<Order>[] = [
    {
      key: 'symbol',
      header: 'Asset',
      render: (o) => (
        <div>
          <span className="font-semibold text-text-primary">{o.symbol}</span>
          <span className="block text-xs text-text-muted">{o.name}</span>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (o) => (
        <Badge variant={o.side === 'BUY' ? 'info' : 'warning'}>
          {o.side}
        </Badge>
      ),
    },
    {
      key: 'order_type',
      header: 'Type',
      render: (o) => <span className="text-xs font-medium text-text-secondary">{o.order_type}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (o) => <span className="font-mono">{o.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Order Price',
      align: 'right',
      render: (o) => <span className="font-mono">{formatCurrency(o.limit_price || o.price, currency)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (o) => (
        <Badge variant="warning">
          <Clock className="mr-1 inline-block h-3 w-3" />
          {o.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Placed At',
      align: 'right',
      render: (o) => <span className="text-xs text-text-muted">{formatDate(o.created_at)}</span>,
    },
    {
      key: 'id',
      header: 'Action',
      align: 'center',
      render: (o) => (
        <button
          onClick={() => cancelOrder(o.id)}
          className="text-xs font-medium text-loss hover:underline inline-flex items-center gap-1"
        >
          <XCircle className="h-3 w-3" /> Cancel
        </button>
      ),
    },
  ];

  const tradeColumns: Column<Trade>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      render: (t) => (
        <div>
          <span className="font-semibold text-text-primary">{t.symbol}</span>
          <span className="block text-xs text-text-muted">{t.name}</span>
        </div>
      ),
    },
    {
      key: 'side',
      header: 'Side',
      render: (t) => (
        <Badge variant={t.side === 'BUY' ? 'gain' : 'loss'}>
          {t.side}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      render: (t) => <span className="font-mono">{t.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Exec Price',
      align: 'right',
      render: (t) => <span className="font-mono">{formatCurrency(t.price, currency)}</span>,
    },
    {
      key: 'total',
      header: 'Total Value',
      align: 'right',
      render: (t) => <span className="font-mono font-medium">{formatCurrency(t.total, currency)}</span>,
    },
    {
      key: 'fees',
      header: 'Brokerage Fee',
      align: 'right',
      render: (t) => <span className="text-xs font-mono text-text-muted">{formatCurrency(t.fees, currency)}</span>,
    },
    {
      key: 'pnl',
      header: 'Realized P&L',
      align: 'right',
      render: (t) => (
        <span className={t.pnl !== undefined ? `font-mono font-semibold ${getChangeColor(t.pnl)}` : 'text-text-muted'}>
          {t.pnl !== undefined
            ? `${t.pnl >= 0 ? '+' : ''}${formatCurrency(t.pnl, currency)}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'executed_at',
      header: 'Executed',
      align: 'right',
      render: (t) => <span className="text-xs text-text-muted">{formatDate(t.executed_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <DemoBanner />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Paper Trading Desk</h1>
          <p className="text-sm text-text-secondary">
            Simulated execution engine for <span className="font-semibold text-text-primary">{currentUser.name}</span> ({currentUser.email})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={resetPortfolio}
          title="Reset paper trading ledger to initial demo state"
        >
          Reset Paper Portfolio
        </Button>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-light/40 p-4 text-sm text-info">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <span className="font-semibold text-text-primary">Simulated Execution Active:</span>{' '}
          <span className="text-text-secondary">
            Market orders execute instantly against current demo quote with realistic slippage (+0.05%) and flat brokerage fee ({currency === 'INR' ? '₹20.00' : '$1.99'}). Account isolation guarantees your paper ledger is private to your profile.
          </span>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-gain-light/30 border-gain/40 text-gain'
              : 'bg-loss-light/30 border-loss/40 text-loss'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Order Entry Form & Account Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">New Paper Order</h2>
            <p className="text-xs text-text-muted">Configure and place simulated trade</p>
          </div>

          <form onSubmit={handleExecuteOrder} className="space-y-4">
            {/* Side selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                  side === 'BUY'
                    ? 'bg-gain text-white shadow-sm'
                    : 'bg-surface-secondary text-text-secondary hover:bg-border/60'
                }`}
              >
                Buy (Long)
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                  side === 'SELL'
                    ? 'bg-loss text-white shadow-sm'
                    : 'bg-surface-secondary text-text-secondary hover:bg-border/60'
                }`}
              >
                Sell (Exit)
              </button>
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Asset Symbol
              </label>
              <select
                value={selectedSymbol}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {SUPPORTED_TICKERS.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} — {t.name} ({formatCurrency(t.basePrice, t.currency)})
                  </option>
                ))}
              </select>
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Order Type
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="MARKET">Market Order (Instant Fill)</option>
                <option value="LIMIT">Limit Order (Pending)</option>
                <option value="STOP_LOSS">Stop Loss Order (Pending)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Price (if Limit or Stop) */}
            {orderType !== 'MARKET' ? (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {orderType === 'LIMIT' ? 'Limit Price' : 'Stop Price'} ({currency})
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            ) : (
              <div>
                <span className="block text-xs font-medium text-text-secondary mb-1">
                  Estimated Fill Price
                </span>
                <div className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm font-mono text-text-primary">
                  {formatCurrency(currentPrice, currency)}
                </div>
              </div>
            )}

            {/* Order summary estimate */}
            <div className="rounded-lg bg-surface-secondary p-3 text-xs space-y-1.5 border border-border/40">
              <div className="flex justify-between text-text-secondary">
                <span>Estimated Value:</span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatCurrency(estimatedTotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Simulated Brokerage Fee:</span>
                <span className="font-mono text-text-primary">{formatCurrency(estimatedFee, currency)}</span>
              </div>
              <div className="flex justify-between text-text-secondary pt-1 border-t border-border/40">
                <span>Available Cash:</span>
                <span className="font-mono font-bold text-brand">
                  {formatCurrency(portfolio.cash_balance, currency)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant={side === 'BUY' ? 'primary' : 'danger'}
              className="w-full"
              icon={<ArrowLeftRight className="h-4 w-4" />}
            >
              Submit Simulated {side} Order
            </Button>
          </form>
        </Card>

        {/* Pending Orders & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Open Simulated Orders</h2>
                <p className="text-xs text-text-muted">Active limit and stop orders awaiting price trigger</p>
              </div>
              <Badge variant={pendingOrders.length > 0 ? 'warning' : 'neutral'}>
                {pendingOrders.length} Pending
              </Badge>
            </div>
            <DataTable
              columns={orderColumns}
              data={pendingOrders}
              keyExtractor={(o) => o.id}
              emptyMessage="No pending orders. Market orders execute immediately into trade history."
            />
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Executed Trades History</h2>
                <p className="text-xs text-text-muted">Historical paper fills and realized returns</p>
              </div>
              <Badge variant="gain">
                <CheckCircle2 className="mr-1 inline-block h-3 w-3" />
                {trades.length} Fills
              </Badge>
            </div>
            <DataTable
              columns={tradeColumns}
              data={trades}
              keyExtractor={(t) => t.id}
              emptyMessage="No executed trades yet. Place a simulated market order to generate fills."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
