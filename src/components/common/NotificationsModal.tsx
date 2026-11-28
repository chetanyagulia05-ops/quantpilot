// ============================================================
// QuantPilot — Live Execution & Alert Notifications Dialog
// Uses native <dialog> + live backend execution events.
// ============================================================

import { useId } from 'react';
import { Bell, CheckCheck, X, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import NativeDialog from '@/components/ui/NativeDialog';
import { usePortfolio } from '@/context/PortfolioContext';
import { formatRelativeTime } from '@/lib/utils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const titleId = useId();
  const { notifications, markAllNotificationsRead } = usePortfolio();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      className="max-w-md"
    >
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-brand" />
          <h2 id={titleId} className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Execution &amp; System Events
          </h2>
          {unreadCount > 0 && (
            <span className="rounded bg-brand/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            title="Mark all as read"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
            title="Close"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-border p-1">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            No execution or alert events yet.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 text-xs rounded-md transition-colors ${
                item.read ? 'opacity-65' : 'bg-secondary/40'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {item.type === 'trade' && <CheckCircle2 className="h-3.5 w-3.5 text-gain" />}
                  {item.type === 'alert' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                  {item.type === 'system' && <TrendingUp className="h-3.5 w-3.5 text-info" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{item.title}</span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </NativeDialog>
  );
}
