import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names conditionally with conflict resolution (shadcn/ui standard).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency with full support for INR (₹) and other global currencies.
 * Adheres strictly to Indian numbering conventions (Lakhs and Crores) for INR.
 * NEVER prepends a dollar symbol to an INR value.
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'INR',
  compact: boolean = false
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  const isINR = currency === 'INR';
  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (compact) {
    if (isINR) {
      if (absVal >= 10_000_000) {
        return `${sign}₹${(absVal / 10_000_000).toFixed(2)}Cr`;
      }
      if (absVal >= 100_000) {
        return `${sign}₹${(absVal / 100_000).toFixed(2)}L`;
      }
      if (absVal >= 1_000) {
        return `${sign}₹${(absVal / 1_000).toFixed(1)}K`;
      }
      return `${sign}₹${absVal.toFixed(2)}`;
    } else {
      const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
      if (absVal >= 1_000_000_000) {
        return `${sign}${sym}${(absVal / 1_000_000_000).toFixed(2)}B`;
      }
      if (absVal >= 1_000_000) {
        return `${sign}${sym}${(absVal / 1_000_000).toFixed(2)}M`;
      }
      if (absVal >= 1_000) {
        return `${sign}${sym}${(absVal / 1_000).toFixed(1)}K`;
      }
      return `${sign}${sym}${absVal.toFixed(2)}`;
    }
  }

  const locale = isINR ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    const sym = isINR ? '₹' : currency === 'USD' ? '$' : `${currency} `;
    return `${sign}${sym}${absVal.toFixed(2)}`;
  }
}

/**
 * Format a number as percentage return with sign.
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a percentage point difference (e.g. +1.40 pp)
 */
export function formatPercentPoints(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)} pp`;
}

/**
 * Format a number with localized thousands separators.
 */
export function formatNumber(value: number | null | undefined, locale = 'en-IN'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format trading volume compactly.
 */
export function formatVolume(value: number | null | undefined, isIndian = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }
  const abs = Math.abs(value);
  if (isIndian) {
    if (abs >= 10_000_000) return `${(value / 10_000_000).toFixed(2)} Cr`;
    if (abs >= 100_000) return `${(value / 100_000).toFixed(2)} L`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)} K`;
  } else {
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format date in Indian Standard Time or local user timezone.
 */
export function formatDate(
  dateStr: string,
  style: 'short' | 'long' | 'time' = 'short',
  useIST = true
): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const timeZone = useIST ? 'Asia/Kolkata' : undefined;

  if (style === 'time') {
    return date.toLocaleTimeString('en-IN', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  if (style === 'long') {
    return date.toLocaleDateString('en-IN', {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-IN', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Relative time calculation.
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/**
 * Text color for P&L / changes.
 */
export function getChangeColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'text-text-secondary';
  if (value > 0) return 'text-gain';
  if (value < 0) return 'text-loss';
  return 'text-text-secondary';
}

/**
 * Background chip color for changes.
 */
export function getChangeBgColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'bg-surface-secondary text-text-secondary';
  if (value > 0) return 'bg-gain-light text-gain';
  if (value < 0) return 'bg-loss-light text-loss';
  return 'bg-surface-secondary text-text-secondary';
}
