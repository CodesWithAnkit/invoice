import * as React from "react";

/** Centered card layout shared by the sign-in, sign-up and password pages. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-h2">{title}</h1>
            {description && <p className="text-body text-muted-foreground">{description}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-body text-muted-foreground">{footer}</div>}
      </div>
    </main>
  );
}
