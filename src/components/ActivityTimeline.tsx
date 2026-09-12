import { cn } from "@/lib/utils";
import React from "react";

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (!events?.length) return null;

  return (
    <div className={cn("relative border-l border-border ml-3", className)}>
      {events.map((event, index) => (
        <div key={event.id} className="mb-8 pl-6 relative last:mb-0">
          <div className="absolute w-3 h-3 bg-muted border-2 border-background rounded-full left-[-6.5px] top-1.5 ring-4 ring-background" />
          {event.icon && (
            <div className="absolute -left-3 top-0 bg-background text-muted-foreground p-1 rounded-full">
              {event.icon}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-4">
            <h4 className="text-sm font-semibold text-foreground">
              {event.title}
            </h4>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {event.date} {event.time && <span className="mx-1">&middot;</span>} {event.time}
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {event.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
