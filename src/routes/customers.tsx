// Voltcare — /customers layout
// Renders the shared shell once and hands the content area to the index route
// (the list) or the /customers/:id profile. Without <Outlet /> here, the
// profile page could never render and the list would show at /customers/xyz.
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";

export const Route = createFileRoute("/customers")({
  component: () => (
    <AppShell>
      <ClientGate>
        <Outlet />
      </ClientGate>
    </AppShell>
  ),
});
