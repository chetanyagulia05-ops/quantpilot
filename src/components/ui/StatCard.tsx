// ============================================================
// QuantPilot — KPI StatCard (React Bits SpotlightCard + CountUp)
// ============================================================

import { cn, formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import CountUp from '@/components/reactbits/CountUp';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changePct?: number;
  icon?: ReactNode;
  subtitle?: string;
  isCurrency?: boolean;
  currency?: string;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changePct,
  icon,
  subtitle,
  isCurrency = false,
  currency = 'INR',
  decimals = 2,
  suffix = '',
  className,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <SpotlightCard className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="text-[17px] font-semibold tracking-tight text-foreground font-mono-numbers whitespace-nowrap">
            {numericValue !== null ? (
              <CountUp
                to={numericValue}
                duration={0.55}
                formatter={(val) =>
                  isCurrency
                    ? formatCurrency(val, currency)
                    : `${val.toFixed(decimals)}${suffix}`
                }
              />
            ) : (
              value
            )}
          </div>

          {(change !== undefined || changePct !== undefined || subtitle) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {change !== undefined && (
                <span className={cn('font-mono text-xs font-medium', getChangeColor(change))}>
                  {change >= 0 ? '+' : ''}
                  {isCurrency ? formatCurrency(change, currency) : change.toFixed(2)}
                </span>
              )}
              {changePct !== undefined && (
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 font-mono text-[10px] font-medium',
                    changePct >= 0 ? 'bg-gain-light text-gain' : 'bg-loss-light text-loss'
                  )}
                >
                  {formatPercent(changePct)}
                </span>
              )}
              {subtitle && (
                <span className="text-[11px] text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
