import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode, useRef, isValidElement, cloneElement, CSSProperties, PointerEvent, ReactElement } from "react";

interface FormDialogProps {
  trigger?: ReactElement;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string | ReactNode;
  description?: string | ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormDialog({
  trigger,
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  className,
}: FormDialogProps) {
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerWithCapture && (
        <DialogTrigger asChild>
          {triggerWithCapture}
        </DialogTrigger>
      )}
      <DialogContent className={className} style={motionStyle}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
