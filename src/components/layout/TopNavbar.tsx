"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Bell,
  Compass,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/SearchInput";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { primaryNavItems, routeTitles } from "@/config/navigation";

function usePageTitle(pathname: string) {
  const match = routeTitles.find(
    (r) => pathname === r.href || pathname.startsWith(`${r.href}/`)
  );
  return match ?? null;
}

export function TopNavbar() {
  const pathname = usePathname();
  const pageTitle = usePageTitle(pathname);
  const { signOut } = useAuth();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 lg:h-15 lg:px-6 sticky top-0 z-40 backdrop-blur supports-backdrop-filter:bg-background/60 no-print">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-background">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-70">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-14 items-center gap-2 border-b border-border px-4 lg:h-15 lg:px-6">
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold tracking-tight text-sm">NORTHSTAR</span>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-2 text-sm font-medium space-y-1">
              {primaryNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SheetClose asChild key={item.name}>
                    <Link
                      href={item.href!}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground",
                        isActive
                          ? "bg-card text-foreground font-semibold"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:block min-w-0">
        {pageTitle ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">
              {pageTitle.eyebrow}
            </p>
            <p className="text-base font-bold text-foreground leading-tight truncate">
              {pageTitle.title}
            </p>
          </>
        ) : null}
      </div>

      <div className="w-full flex-1 md:flex md:justify-end">
        <form className="w-full md:max-w-sm">
          <SearchInput
            placeholder="Search invoices, customers (⌘K)..."
            className="w-full appearance-none bg-background shadow-none rounded-md"
            containerClassName="max-w-none md:max-w-sm"
          />
        </form>
      </div>

      <Button variant="outline" size="icon" className="h-8 w-8 bg-background shrink-0" disabled>
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button>
      <ThemeToggle />
      <ConfirmModal
        open={isLogoutOpen}
        onOpenChange={setIsLogoutOpen}
        trigger={
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-background shrink-0"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Log out</span>
          </Button>
        }
        title="Log out"
        description="Are you sure you want to log out of Invoice Generator?"
        confirmLabel="Log out"
        variant="destructive"
        onConfirm={signOut}
      />
    </header>
  );
}
