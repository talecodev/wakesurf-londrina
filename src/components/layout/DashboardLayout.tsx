import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface Props {
  variant: "admin" | "rider";
  title: string;
  subtitle?: string;
  onLogout: () => void;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ variant, title, subtitle, onLogout, actions, children }: Props) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar variant={variant} onLogout={onLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6">
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground" />
            <div className="h-5 w-px bg-border hidden md:block" />
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-foreground font-display truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground truncate leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </header>

          {/* Page content with subtle ambient glow */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-40" />
            <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 w-full">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}