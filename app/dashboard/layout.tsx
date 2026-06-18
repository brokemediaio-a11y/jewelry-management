import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { SilverRateInitializer } from "@/components/dashboard/todays-silver-rate";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toaster";
import { ModuleMain } from "@/components/dashboard/module-main";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-screen overflow-hidden">
          <SilverRateInitializer />
          <aside className="hidden md:flex">
            <Sidebar />
          </aside>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Navbar />
            <ModuleMain>{children}</ModuleMain>
          </div>
        </div>
      </TooltipProvider>
    </ToastProvider>
  );
}

