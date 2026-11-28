// ============================================================
// React Bits — AnimatedList (https://github.com/DavidHDev/react-bits)
// Tactile motion/react staggered list for execution & order feeds.
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export default function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  className = '',
  emptyMessage = 'No records available.',
}: AnimatedListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <AnimatePresence initial={false}>
        {items.map((item, idx) => (
          <motion.div
            key={keyExtractor(item)}
            layout
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.985 }}
            transition={{
              type: 'spring',
              stiffness: 460,
              damping: 32,
              delay: Math.min(idx * 0.025, 0.15),
            }}
          >
            {renderItem(item, idx)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
