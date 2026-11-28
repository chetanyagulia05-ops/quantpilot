// ============================================================
// QuantPilot — Native <dialog> Modal Wrapper
// Follows modern-web-guidance dialog guide: showModal(),
// closedby="any" + pointerdown/pointerup fallback, no redundant ARIA.
// ============================================================

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NativeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

export default function NativeDialog({
  isOpen,
  onClose,
  ariaLabelledBy,
  ariaLabel,
  className,
  children,
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    // Light-dismiss fallback for engines without closedby="any" (Safari)
    let cleanupFallback: (() => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      const onDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close();
        }
      };
      dialog.addEventListener('pointerdown', onDown);
      dialog.addEventListener('pointerup', onUp);
      cleanupFallback = () => {
        dialog.removeEventListener('pointerdown', onDown);
        dialog.removeEventListener('pointerup', onUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      cleanupFallback?.();
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={cn(
        'm-auto w-full max-w-xl rounded-lg border border-border bg-card p-0 text-card-foreground shadow-2xl',
        'open:animate-in open:fade-in-0 open:zoom-in-95',
        className
      )}
    >
      {children}
    </dialog>
  );
}
