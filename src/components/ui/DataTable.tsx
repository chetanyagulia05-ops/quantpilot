// ============================================================
// QuantPilot — Accessible Sortable DataTable
// Follows modern-web-guidance: semantic <table>, <caption id>,
// <th scope="col"> with <button type="button">, aria-sort,
// Intl.Collator + numeric sortValue, and single role="status".
// ============================================================

import { useState, useMemo, useId } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortType?: 'string' | 'number';
  sortValue?: (item: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  caption?: string;
  onRowClick?: (item: T) => void;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  caption = 'Financial data table',
  onRowClick,
  compact = false,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const captionId = useId();
  const [sortColKey, setSortColKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'ascending' | 'descending'>('ascending');
  const [statusMessage, setStatusMessage] = useState('');

  const alignClass = (align?: string) => {
    if (align === 'right') return 'text-right justify-end';
    if (align === 'center') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  const handleSort = (col: Column<T>) => {
    const nextDir: 'ascending' | 'descending' =
      sortColKey === col.key && sortDir === 'ascending' ? 'descending' : 'ascending';
    setSortColKey(col.key);
    setSortDir(nextDir);
    setStatusMessage(`Sorted by ${col.header}, ${nextDir}, ${data.length} rows`);
  };

  const sortedData = useMemo(() => {
    if (!sortColKey) return data;
    const col = columns.find((c) => c.key === sortColKey);
    if (!col || !col.sortValue) return data;

    const factor = sortDir === 'ascending' ? 1 : -1;
    const getVal = col.sortValue;
    const isNum = col.sortType === 'number';

    return [...data].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (isNum) {
        return factor * (Number(va) - Number(vb));
      }
      return factor * collator.compare(String(va), String(vb));
    });
  }, [data, columns, sortColKey, sortDir]);

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className={cn('overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md', className)}
    >
      <div role="status" className="sr-only-live">
        {statusMessage}
      </div>
      <table className="w-full border-collapse">
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            {columns.map((col) => {
              const isSortable = Boolean(col.sortable && col.sortValue);
              const isSorted = sortColKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={isSorted ? sortDir : undefined}
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                    isSortable ? 'p-0' : compact ? 'px-3 py-2' : 'px-4 py-2.5',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col)}
                      className={cn(
                        'inline-flex w-full min-h-[32px] items-center gap-1.5 font-semibold uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        alignClass(col.align),
                        compact ? 'px-3 py-2' : 'px-4 py-2.5'
                      )}
                    >
                      <span>{col.header}</span>
                      <span aria-hidden="true" className="inline-flex text-muted-foreground">
                        {isSorted ? (
                          sortDir === 'ascending' ? (
                            <ArrowUp className="h-3 w-3 text-brand" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-brand" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'transition-colors hover:bg-secondary/40',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'text-xs',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                      compact ? 'px-3 py-2' : 'px-4 py-3',
                      col.className
                    )}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
