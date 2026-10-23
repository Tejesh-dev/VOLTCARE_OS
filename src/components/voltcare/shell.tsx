import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { SidebarStateProvider } from "./sidebar-context";
import { StoreHydrator } from "@/store/hydrator";
import { useHydrated } from "@/lib/use-hydrated";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarStateProvider>
      <StoreHydrator />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AppHeader />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </SidebarStateProvider>
  );
}

export function ClientGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const ready = useHydrated();
  if (!ready) return <>{fallback ?? <div className="p-8 text-muted-foreground text-sm">Loading…</div>}</>;
  return <>{children}</>;
}
