"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog, for screen readers. */
  labelledBy: string;
  children: ReactNode;
  size?: "sm" | "md";
}

const WIDTHS = {
  sm: "w-[min(28rem,calc(100vw-1.5rem))]",
  md: "w-[min(44rem,calc(100vw-1.5rem))]",
};

/**
 * Thin wrapper around the native <dialog> element, which gives us focus trapping,
 * Escape-to-close and a backdrop for free. Children mount only while open, so forms
 * inside start fresh every time.
 */
export function Modal({ open, onClose, labelledBy, children, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      // A click that lands on the <dialog> itself (not its content) is a backdrop click.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`${WIDTHS[size]} max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl`}
    >
      {open && children}
    </dialog>
  );
}
