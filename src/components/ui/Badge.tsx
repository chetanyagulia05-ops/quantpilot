import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gain' | 'loss' | 'neutral' | 'info' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  gain: 'bg-gain-light text-gain',
  loss: 'bg-loss-light text-loss',
  neutral: 'bg-gray-100 text-text-secondary',
  info: 'bg-info-light text-info',
  warning: 'bg-warning-light text-warning',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
