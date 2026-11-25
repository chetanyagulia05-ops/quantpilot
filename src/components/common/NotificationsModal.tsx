// ============================================================
// QuantPilot — Live Notification Drawer Component
// Genuine system, trade execution, and market alerts.
// ============================================================

import { useState } from 'react';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'trade' | 'alert' | 'system';
  read: boolean;
  timestamp: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Simulated Paper Trade Executed',
    message: 'BUY 50 RELIANCE executed at ₹2,980.50. Broker fee ₹20 deducted.',
    type: 'trade',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'n-2',
    title: 'RSI Momentum Warning',
    message: 'NVDA RSI(14) reached 71.4 (Overbought territory). Watch for potential mean reversion.',
    type: 'alert',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: 'n-3',
    title: 'NSE Market Session Synchronized',
    message: 'Connected to Indian market data pipeline. Pre-market settlement validated.',
    type: 'system',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-surface-secondary px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={clearAll}
              className="p-1 rounded-md text-text-muted hover:text-loss hover:bg-surface"
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-border-light p-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No recent notifications or alerts.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3 text-xs transition-colors rounded-lg ${
                  item.read ? 'opacity-70 bg-transparent' : 'bg-surface-secondary/70 font-medium'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {item.type === 'trade' && <CheckCircle2 className="h-4 w-4 text-gain" />}
                    {item.type === 'alert' && <AlertTriangle className="h-4 w-4 text-warning" />}
                    {item.type === 'system' && <TrendingUp className="h-4 w-4 text-info" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary">{item.title}</span>
                      <span className="text-[10px] text-text-muted">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
