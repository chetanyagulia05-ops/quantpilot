// ============================================================
// QuantPilot — Motion SegmentedControl (layoutId spring switch)
// Crisp hardware-switch click physics for BUY/SELL, timeframes, tabs.
// ============================================================

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  tone?: 'default' | 'gain' | 'loss';
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-secondary/70 p-0.5',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const activeBg =
          opt.tone === 'gain'
            ? 'bg-gain text-white'
            : opt.tone === 'loss'
            ? 'bg-loss text-white'
            : 'bg-card text-foreground shadow-2xs border border-border';

        return (
          <motion.button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 550, damping: 32 }}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-[5px] font-medium transition-colors cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
              active
                ? opt.tone === 'gain' || opt.tone === 'loss'
                  ? 'text-white font-semibold'
                  : 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                className={cn('absolute inset-0 rounded-[5px]', activeBg)}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
