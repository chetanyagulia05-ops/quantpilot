// ============================================================
// QuantPilot — Live Market Session & IST Clock Status Pill
// Real-time calculation of Indian Market (NSE/BSE) trading hours.
// ============================================================

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function MarketStatusPill() {
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    isPreMarket: boolean;
    istTime: string;
    label: string;
  }>({
    isOpen: false,
    isPreMarket: false,
    istTime: '',
    label: 'Checking market...',
  });

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();

      // Convert to IST (UTC + 5:30)
      const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istDate = new Date(istString);

      const dayOfWeek = istDate.getDay(); // 0 = Sunday, 6 = Saturday
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const currentMinuteOfDay = hours * 60 + minutes;

      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isPreMarket = isWeekday && currentMinuteOfDay >= 9 * 60 && currentMinuteOfDay < 9 * 60 + 15; // 09:00 - 09:15
      const isOpen = isWeekday && currentMinuteOfDay >= 9 * 60 + 15 && currentMinuteOfDay <= 15 * 60 + 30; // 09:15 - 15:30

      const istTimeFormatted = istDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      let label = 'NSE Closed';
      if (isOpen) label = 'NSE Live (09:15 - 15:30 IST)';
      else if (isPreMarket) label = 'NSE Pre-Market';
      else label = `NSE Closed (Reopens 09:15 IST)`;

      setMarketStatus({
        isOpen,
        isPreMarket,
        istTime: istTimeFormatted,
        label,
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            marketStatus.isOpen
              ? 'bg-gain animate-pulse'
              : marketStatus.isPreMarket
              ? 'bg-warning animate-pulse'
              : 'bg-text-muted'
          }`}
        />
        <span className="font-semibold text-text-primary text-[11px]">
          {marketStatus.isOpen ? 'NSE Open' : marketStatus.isPreMarket ? 'NSE Pre-Open' : 'NSE Closed'}
        </span>
      </div>
      <span className="text-border">|</span>
      <div className="flex items-center gap-1 text-[11px] text-text-muted">
        <Clock className="h-3 w-3" />
        <span>{marketStatus.istTime} IST</span>
      </div>
    </div>
  );
}
