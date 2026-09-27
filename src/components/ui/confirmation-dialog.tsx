import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReactNode, useRef, isValidElement, cloneElement, CSSProperties, PointerEvent, ReactElement } from "react";

interface ConfirmationDialogProps {
  trigger?: ReactElement;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string | ReactNode;
  description: string | ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function ConfirmationDialog({
  trigger,
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Continue",
  cancelText = "Cancel",
  destructive = false,
}: ConfirmationDialogProps) {
  const originRef = useRef({ x: 0, y: 0 });

  const captureOrigin = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    originRef.current = {
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    };
  };

  const triggerWithCapture = trigger && isValidElement(trigger)
    ? cloneElement(trigger, {
        onPointerDown: (e: PointerEvent) => {
          captureOrigin(e.currentTarget as HTMLElement);
          (trigger.props as { onPointerDown?: (e: PointerEvent) => void })
            .onPointerDown?.(e);
        },
      } as Partial<unknown>)
    : trigger;

  const { x, y } = originRef.current;
  const motionStyle: CSSProperties = trigger ? {
    ["--tw-enter-translate-x" as string]: `${x}px`,
    ["--tw-enter-translate-y" as string]: `${y}px`,
    ["--tw-enter-scale" as string]: "0.3",
    ["--tw-exit-translate-x" as string]: `${x}px`,
    ["--tw-exit-translate-y" as string]: `${y}px`,
    ["--tw-exit-scale" as string]: "0.45",
    animationDuration: "320ms",
    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  } : {};

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerWithCapture && (
        <AlertDialogTrigger asChild>
          {triggerWithCapture}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent style={motionStyle}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent immediate close if needed
              onConfirm();
              if (onOpenChange) onOpenChange(false);
            }}
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
