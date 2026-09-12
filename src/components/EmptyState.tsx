import { FileText } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  className?: string;
  isCard?: boolean;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  secondaryAction, 
  icon,
  className,
  isCard = true
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      isCard ? "py-16 px-4 border rounded-xl bg-card border-dashed" : "py-12",
      className
    )}>
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon || <FileText className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
