// ============================================================
// QuantPilot — shadcn/ui Badge Variants
// ============================================================

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border font-mono text-[11px] font-medium leading-none transition-colors',
  {
    variants: {
      variant: {
        gain: 'border-gain/25 bg-gain-light text-gain',
        loss: 'border-loss/25 bg-loss-light text-loss',
        neutral: 'border-border bg-secondary text-secondary-foreground',
        info: 'border-info/25 bg-info-light text-info',
        warning: 'border-warning/25 bg-warning-light text-warning',
        brand: 'border-brand/30 bg-brand/10 text-brand',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
}: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}
