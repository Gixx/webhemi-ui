import { Button } from '../Button/Button';
import { cn } from '../../lib/cn';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav
      className={cn('wh-ui mt-4 flex items-center justify-between gap-3', className)}
      aria-label="Pagination"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-[var(--wh-color-muted)]">
        Page {page} of {pageCount}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
