import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Button } from '../Button/Button';
import { cn } from '../../lib/cn';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, title, children, onClose, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="wh-ui fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--wh-color-ink)]/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wh-modal-title"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-[var(--wh-radius-md)] border border-[var(--wh-color-line)] bg-[var(--wh-color-surface)] shadow-lg',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--wh-color-line)] px-4 py-3">
          <h2 id="wh-modal-title" className="font-[family-name:var(--wh-font-display)] text-lg">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ×
          </Button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[var(--wh-color-line)] px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
