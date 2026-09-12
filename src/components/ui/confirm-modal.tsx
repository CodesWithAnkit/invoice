"use client";

import { cloneElement, isValidElement, useRef } from "react";
import type { CSSProperties, PointerEvent, ReactElement } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ConfirmModalProps {
  trigger: ReactElement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}

/**
 * A confirmation dialog that lands centered on screen but visually grows
 * out of the button that opened it, using tailwindcss-animate's
 * --tw-enter/exit CSS vars (inline styles win over the shared DialogContent's
 * default slide/zoom classes) instead of a fixed off-center offset.
 */
export function ConfirmModal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmModalProps) {
  const originRef = useRef({ x: 0, y: 0 });

  const captureOrigin = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    };
  };

  const triggerWithCapture = isValidElement(trigger)
    ? cloneElement(trigger, {
        onPointerDown: (e: PointerEvent) => {
          captureOrigin(e.currentTarget as HTMLElement);
          (trigger.props as { onPointerDown?: (e: PointerEvent) => void })
            .onPointerDown?.(e);
        },
      } as Partial<unknown>)
    : trigger;

  const { x, y } = originRef.current;
  const motionStyle: CSSProperties = {
    ["--tw-enter-translate-x" as string]: `${x}px`,
    ["--tw-enter-translate-y" as string]: `${y}px`,
    ["--tw-enter-scale" as string]: "0.3",
    ["--tw-exit-translate-x" as string]: `${x}px`,
    ["--tw-exit-translate-y" as string]: `${y}px`,
    ["--tw-exit-scale" as string]: "0.45",
    animationDuration: "320ms",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{triggerWithCapture}</DialogTrigger>
      <DialogContent className="sm:max-w-sm" style={motionStyle}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
