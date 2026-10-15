import { cn } from '@/lib/utils';

interface LoadingStateProps {
  rows?: number;
  className?: string;
  variant?: 'card' | 'table' | 'chart';
}

function SkeletonLine({ width = '100%' }: { width?: string }) {
  return (
    <div
      className="h-4 animate-pulse rounded bg-border"
      style={{ width }}
    />
  );
}

export default function LoadingState({
  rows = 3,
  className,
  variant = 'card',
}: LoadingStateProps) {
  if (variant === 'chart') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="h-6 w-40 animate-pulse rounded bg-border" />
        <div className="h-48 animate-pulse rounded-lg bg-border" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex gap-4">
          <SkeletonLine width="20%" />
          <SkeletonLine width="30%" />
          <SkeletonLine width="15%" />
          <SkeletonLine width="15%" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            <SkeletonLine width="20%" />
            <SkeletonLine width="30%" />
            <SkeletonLine width="15%" />
            <SkeletonLine width="15%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? '60%' : i === 1 ? '80%' : '40%'} />
      ))}
    </div>
  );
}
