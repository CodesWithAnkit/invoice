import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Toaster } from "sonner";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full min-w-0">
        <TopNavbar />
        {/* pb-20 reserves space above the mobile bottom nav; zeroed out for
            print via the reset rule in src/styles/invoice-print.css */}
        <main className="flex-1 p-4 pb-20 md:pb-4 sm:px-6 sm:py-0 md:gap-8 min-w-0">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <Toaster position="top-right" richColors />
    </div>
  );
}
