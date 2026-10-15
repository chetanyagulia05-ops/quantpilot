import { cn, formatCurrency, formatPercent, getChangeColor } from '@/lib/utils';
import Card from './Card';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changePct?: number;
  icon?: ReactNode;
  prefix?: string;
  isCurrency?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changePct,
  icon,
  isCurrency = false,
  className,
}: StatCardProps) {
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{displayValue}</p>
          {(change !== undefined || changePct !== undefined) && (
            <div className="flex items-center gap-1.5">
              {change !== undefined && (
                <span className={cn('text-sm font-medium', getChangeColor(change))}>
                  {change >= 0 ? '+' : ''}
                  {isCurrency ? formatCurrency(change) : change.toFixed(2)}
                </span>
              )}
              {changePct !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-medium',
                    changePct >= 0
                      ? 'bg-gain-light text-gain'
                      : 'bg-loss-light text-loss'
                  )}
                >
                  {formatPercent(changePct)}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-brand/10 p-2.5 text-brand">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
