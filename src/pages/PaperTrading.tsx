import { useState } from 'react';
import { Info, ArrowLeftRight, Clock, CheckCircle2 } from 'lucide-react';
import DemoBanner from '@/components/ui/DemoBanner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate, getChangeColor } from '@/lib/utils';
import { demoOrders, demoTrades, demoPortfolio } from '@/data/demo';
import type { Order, Trade } from '@/types';

export default function PaperTrading() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('NVDA');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('LIMIT');
  const [quantity, setQuantity] = useState(10);
  const [price, setPrice] = useState(680.0);

  const pendingOrders = demoOrders.filter((o) => o.status === 'PENDING');

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
      render: (o) => <span>{o.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Order Price',
      align: 'right',
      render: (o) => <span>{formatCurrency(o.limit_price || o.price)}</span>,
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
      render: (t) => <span>{t.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Exec Price',
      align: 'right',
      render: (t) => <span>{formatCurrency(t.price)}</span>,
    },
    {
      key: 'total',
      header: 'Total Value',
      align: 'right',
      render: (t) => <span className="font-medium">{formatCurrency(t.total)}</span>,
    },
    {
      key: 'fees',
      header: 'Fees',
      align: 'right',
      render: (t) => <span className="text-xs text-text-muted">{formatCurrency(t.fees)}</span>,
    },
    {
      key: 'pnl',
      header: 'Realized P&L',
      align: 'right',
      render: (t) => (
        <span className={t.pnl !== undefined ? `font-semibold ${getChangeColor(t.pnl)}` : 'text-text-muted'}>
          {t.pnl !== undefined
            ? `${t.pnl >= 0 ? '+' : ''}${formatCurrency(t.pnl)}`
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Paper Trading</h1>
        <p className="text-sm text-text-secondary">Simulated order execution and virtual position management</p>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info-light/40 p-4 text-sm text-info">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <span className="font-semibold text-text-primary">Simulated Trading Environment:</span>{' '}
          <span className="text-text-secondary">
            Paper trading uses simulated orders. Real capital is not at risk. Future milestone paper-trading
            engine will model real-world trading parameters such as order routing delays, slippage, liquidity,
            and broker fees.
          </span>
        </div>
      </div>

      {/* Order Entry Form & Account Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">New Paper Order</h2>
            <p className="text-xs text-text-muted">Configure and place simulated trade</p>
          </div>

          <div className="space-y-4">
            {/* Side selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                  side === 'BUY'
                    ? 'bg-gain text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-border/60'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
                  side === 'SELL'
                    ? 'bg-loss text-white'
                    : 'bg-surface-secondary text-text-secondary hover:bg-border/60'
                }`}
              >
                Sell
              </button>
            </div>

            {/* Symbol */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Asset Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm uppercase font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g. AAPL"
              />
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
                <option value="MARKET">Market Order</option>
                <option value="LIMIT">Limit Order</option>
                <option value="STOP_LOSS">Stop Loss Order</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Quantity (Shares)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Limit Price */}
            {orderType !== 'MARKET' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {orderType === 'LIMIT' ? 'Limit Price ($)' : 'Stop Price ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            )}

            {/* Order summary estimate */}
            <div className="rounded-lg bg-surface-secondary p-3 text-xs space-y-1">
              <div className="flex justify-between text-text-secondary">
                <span>Estimated Value:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(quantity * price)}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Simulated Broker Fee:</span>
                <span>$1.99</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Available Cash:</span>
                <span>{formatCurrency(demoPortfolio.cash_balance)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              disabled
              className="w-full"
              icon={<ArrowLeftRight className="h-4 w-4" />}
            >
              Execute Simulated {side}
            </Button>
            <p className="text-center text-[11px] text-text-muted">
              Live paper execution will activate with Supabase + Market API connection.
            </p>
          </div>
        </Card>

        {/* Pending Orders & Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Open Simulated Orders</h2>
                <p className="text-xs text-text-muted">Active limit and stop orders awaiting trigger</p>
              </div>
            </div>
            <DataTable
              columns={orderColumns}
              data={pendingOrders}
              keyExtractor={(o) => o.id}
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
                {demoTrades.length} Fills
              </Badge>
            </div>
            <DataTable
              columns={tradeColumns}
              data={demoTrades}
              keyExtractor={(t) => t.id}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
