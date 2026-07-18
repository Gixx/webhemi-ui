import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No records found.',
  loading = false,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="wh-ui rounded-[var(--wh-radius-md)] border border-[var(--wh-color-line)] bg-[var(--wh-color-surface)] p-8 text-center text-[var(--wh-color-muted)]">
        Loading…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="wh-ui rounded-[var(--wh-radius-md)] border border-dashed border-[var(--wh-color-line)] bg-[var(--wh-color-surface)] p-8 text-center text-[var(--wh-color-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'wh-ui overflow-x-auto rounded-[var(--wh-radius-md)] border border-[var(--wh-color-line)] bg-[var(--wh-color-surface)]',
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--wh-color-canvas)] text-[var(--wh-color-muted)]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 font-semibold', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-t border-[var(--wh-color-line)] hover:bg-[color-mix(in_srgb,var(--wh-color-accent)_6%,white)]"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
